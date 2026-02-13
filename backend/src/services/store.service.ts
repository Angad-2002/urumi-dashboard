import storeRepository from '../repositories/store.repository';
import kubernetesService from './kubernetes.service';
import helmService from './helm.service';
import monitorService from './monitor.service';
import { Store, StoreType } from '../models/store.model';
import {
  generateStoreId,
  generatePassword,
  slugFromName,
  namespaceFromSlug
} from '../utils/crypto';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const MAX_STORES = parseInt(process.env.MAX_STORES || '50', 10);
const MAX_STORES_PER_USER = parseInt(process.env.MAX_STORES_PER_USER || '100', 10);
const MAX_CONCURRENT_PROVISIONS = parseInt(process.env.MAX_CONCURRENT_PROVISIONS || '3', 10);
const PROVISION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export class StoreService {
  private provisioningCount = 0;

  async createStore(params: {
    name: string;
    type: StoreType;
    userId?: string | null;
  }): Promise<Store> {
    const { name, type, userId } = params;

    const total = await storeRepository.count();
    if (total >= MAX_STORES) {
      throw new AppError(`Maximum stores (${MAX_STORES}) reached`, 429);
    }
    if (userId) {
      const userCount = await storeRepository.countByUserId(userId);
      if (userCount >= MAX_STORES_PER_USER) {
        throw new AppError(
          `Store limit reached (${userCount}/${MAX_STORES_PER_USER}). Delete a store to create another.`,
          429
        );
      }
    }
    if (this.provisioningCount >= MAX_CONCURRENT_PROVISIONS) {
      throw new AppError(
        `Maximum concurrent provisions (${MAX_CONCURRENT_PROVISIONS}) reached. Try again later.`,
        429
      );
    }

    const slug = slugFromName(name);
    let namespace = namespaceFromSlug(slug);
    const existing = await storeRepository.findByNamespace(namespace);
    const storeId = generateStoreId(12);
    if (existing) {
      namespace = namespaceFromSlug(slug, storeId.slice(0, 6));
    }

    const store = await storeRepository.create({
      id: storeId,
      type,
      name,
      namespace,
      status: 'Provisioning',
      url: null,
      admin_url: null,
      error_message: null,
      user_id: userId ?? null
    });

    logger.info('Store creation initiated', { storeId, type, name, namespace });
    this.provisionStoreAsync(store).catch((err) => {
      logger.error('Provisioning failed', { storeId, error: (err as Error).message });
      storeRepository.updateStatus(store.id, 'Failed', (err as Error).message);
    });

    return store;
  }

  private async provisionStoreAsync(store: Store): Promise<void> {
    this.provisioningCount++;
    try {
      const ingressSuffix =
        process.env.ENVIRONMENT === 'production'
          ? process.env.PROD_INGRESS_SUFFIX || '.yourdomain.com'
          : process.env.LOCAL_INGRESS_SUFFIX || '.localhost';
      const hostBase = store.namespace.replace(/^store-/, '');
      const ingressHost = `${hostBase}${ingressSuffix}`;

      if (store.type === 'medusa') {
        const postgresPassword = generatePassword(24);
        const adminPassword = generatePassword(16);
        const jwtSecret = generatePassword(32);
        const cookieSecret = generatePassword(32);
        await helmService.installMedusa(store.id, store.namespace, {
          storeName: store.id,
          storeId: store.id,
          ingressHost,
          postgresPassword,
          adminEmail: 'admin@example.com',
          adminPassword,
          jwtSecret,
          cookieSecret,
          seedDemoData: true
        });
      } else {
        const dbPassword = generatePassword(24);
        const wpAdminPassword = generatePassword(24);
        await helmService.install(store.id, store.namespace, {
          storeId: store.id,
          dbPassword,
          wpAdminPassword,
          ingressHost
        });
      }

      const ready = await monitorService.waitForReady(store.namespace, {
        timeout: PROVISION_TIMEOUT_MS,
        storeType: store.type,
        storeId: store.id
      });

      if (!ready) {
        throw new Error('Store did not become ready within 5 minutes');
      }

      const scheme = process.env.ENVIRONMENT === 'production' ? 'https' : 'http';
      const url = `${scheme}://${ingressHost}`;
      const adminUrl =
        store.type === 'woocommerce' ? `${url}/wp-admin` : `${url}/app`;
      await storeRepository.updateStatus(store.id, 'Ready', null, url, adminUrl);
      logger.info('Store provisioning completed', { storeId: store.id, url });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Provisioning failed, cleaning up', { storeId: store.id, error: message });
      await this.cleanupFailedStore(store.namespace, store.id);
      await storeRepository.updateStatus(store.id, 'Failed', message);
    } finally {
      this.provisioningCount--;
    }
  }

  private async cleanupFailedStore(namespace: string, storeId: string): Promise<void> {
    try {
      await helmService.uninstall(storeId, namespace);
    } catch (e) {
      logger.warn('Helm uninstall during cleanup failed', { namespace, error: (e as Error).message });
    }
    try {
      await kubernetesService.deleteNamespace(namespace);
    } catch (e) {
      logger.warn('Namespace delete during cleanup failed', { namespace, error: (e as Error).message });
    }
  }

  async getAllStores(userId?: string | null): Promise<Store[]> {
    if (userId) return storeRepository.findByUserId(userId);
    return storeRepository.findAll();
  }

  async retryStore(id: string): Promise<Store> {
    const store = await storeRepository.findById(id);
    if (!store) throw new AppError(`Store ${id} not found`, 404);
    if (store.status !== 'Failed') {
      throw new AppError('Only failed stores can be retried', 400);
    }
    if (this.provisioningCount >= MAX_CONCURRENT_PROVISIONS) {
      throw new AppError(
        `Maximum concurrent provisions (${MAX_CONCURRENT_PROVISIONS}) reached. Try again later.`,
        429
      );
    }
    await storeRepository.updateStatus(store.id, 'Provisioning', null);
    logger.info('Store retry initiated', { storeId: id });
    this.provisionStoreAsync({ ...store, status: 'Provisioning' }).catch((err) => {
      logger.error('Retry provisioning failed', { storeId: id, error: (err as Error).message });
      storeRepository.updateStatus(store.id, 'Failed', (err as Error).message);
    });
    const updated = await storeRepository.findById(id);
    if (!updated) throw new Error('Store not found after retry');
    return updated;
  }

  async getStoreById(id: string): Promise<Store | null> {
    return storeRepository.findById(id);
  }

  async getStoreStatus(id: string): Promise<{
    id: string;
    status: string;
    url: string | null;
    error_message: string | null;
  } | null> {
    const store = await storeRepository.findById(id);
    if (!store) return null;
    return {
      id: store.id,
      status: store.status,
      url: store.url,
      error_message: store.error_message
    };
  }

  async getStoreDetail(id: string): Promise<{
    resources: Array<{ kind: string; name: string; status: string; replicas?: string; age: string }>;
    events: Array<{ timestamp: string; message: string; type: 'Normal' | 'Warning' | 'Error' }>;
    podRestarts?: number;
    provisioningSteps?: Array<{ label: string; completed: boolean; error?: boolean }>;
    quotas?: { cpuUsed: string; cpuLimit: string; memUsed: string; memLimit: string; pvcUsed: string; pvcLimit: string };
  } | null> {
    const store = await storeRepository.findById(id);
    if (!store) return null;
    const [resources, events, podRestarts, usage, hasIngress, namespaceExists, hasSecrets] =
      await Promise.all([
        kubernetesService.listNamespaceResources(store.namespace),
        kubernetesService.listNamespaceEvents(store.namespace),
        kubernetesService.getNamespacePodRestarts(store.namespace),
        kubernetesService.getNamespaceResourceUsage(store.namespace),
        kubernetesService.hasIngress(store.namespace),
        kubernetesService.namespaceExists(store.namespace),
        kubernetesService.hasSecrets(store.namespace)
      ]);
    const databaseReady = resources.some(
      (r) => r.kind === 'StatefulSet' && r.status === 'Running'
    );
    const appDeployed = resources.some(
      (r) => (r.kind === 'Deployment' || r.kind === 'StatefulSet') && r.status === 'Running'
    );
    const ingressReady = !!store.url || hasIngress;
    const provisioningSteps: Array<{ label: string; completed: boolean; error?: boolean }> = [
      { label: 'Namespace created', completed: namespaceExists },
      { label: 'Secrets generated', completed: hasSecrets },
      { label: 'Database ready', completed: databaseReady },
      { label: 'App deployed', completed: appDeployed },
      { label: 'Ingress ready', completed: ingressReady }
    ];
    const quotas = {
      cpuUsed: usage.cpuRequested,
      cpuLimit: '500m',
      memUsed: usage.memRequested,
      memLimit: '512Mi',
      pvcUsed: usage.pvcCapacity,
      pvcLimit: '5Gi'
    };
    return { resources, events, podRestarts, provisioningSteps, quotas };
  }

  async deleteStore(id: string): Promise<void> {
    const store = await storeRepository.findById(id);
    if (!store) throw new AppError(`Store ${id} not found`, 404);

    logger.info('Starting store deletion', { storeId: id });
    await storeRepository.updateStatus(id, 'Deleting');

    try {
      try {
        await helmService.uninstall(store.id, store.namespace);
      } catch (helmErr: unknown) {
        const msg = helmErr instanceof Error ? helmErr.message : String(helmErr);
        if (msg.includes('release: not found') || msg.includes('Release not loaded')) {
          logger.warn('Helm release not found, continuing with namespace and DB cleanup', {
            storeId: id
          });
        } else {
          throw helmErr;
        }
      }
      await kubernetesService.deleteNamespace(store.namespace);
      await storeRepository.deleteById(id);
      logger.info('Store deleted', { storeId: id });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Delete failed', { storeId: id, error: message });
      await storeRepository.updateStatus(id, 'Failed', `Deletion failed: ${message}`);
      throw err;
    }
  }
}

export default new StoreService();
