import { Request, Response, NextFunction } from 'express';
import storeService from '../services/store.service';
import { createStoreSchema } from '../validators/store.validator';
import { AppError } from '../middleware/errorHandler';
import { Store } from '../models/store.model';

/** Map DB store to frontend-friendly API (camelCase, status lowercase). Optional detail from K8s. */
function mapStoreToApi(
  s: Store,
  detail?: {
    resources?: Array<{ kind: string; name: string; status: string; replicas?: string; age: string }>;
    events?: Array<{ timestamp: string; message: string; type: 'Normal' | 'Warning' | 'Error' }>;
    podRestarts?: number;
    provisioningSteps?: Array<{ label: string; completed: boolean; error?: boolean }>;
    quotas?: { cpuUsed: string; cpuLimit: string; memUsed: string; memLimit: string; pvcUsed: string; pvcLimit: string };
  }
): Record<string, unknown> {
  const status = s.status.toLowerCase();
  const deploymentAndStateful = detail?.resources?.filter(
    (r) => r.kind === 'Deployment' || r.kind === 'StatefulSet'
  ) ?? [];
  const podsRunning = deploymentAndStateful.reduce((acc, r) => {
    const m = (r.replicas || '').match(/(\d+)\/(\d+)/);
    return m ? acc + parseInt(m[1], 10) : acc;
  }, 0);
  const replicasDesired = deploymentAndStateful.reduce((acc, r) => {
    const m = (r.replicas || '').match(/(\d+)\/(\d+)/);
    return m ? acc + parseInt(m[2], 10) : acc;
  }, 0);
  return {
    id: s.id,
    name: s.name || s.namespace.replace(/^store-/, '').replace(/-/g, ' '),
    engine: s.type,
    status,
    url: s.url,
    adminUrl: s.admin_url,
    createdAt: s.created_at,
    namespace: s.namespace,
    errorMessage: s.error_message,
    userId: s.user_id,
    engineVersion: s.type === 'woocommerce' ? '6.4.2' : '1.20.0',
    replicas: detail?.resources ? replicasDesired : 2,
    podsRunning: detail?.resources ? podsRunning : undefined,
    podRestarts: detail?.podRestarts ?? 0,
    resources: detail?.resources,
    events: detail?.events,
    provisioningSteps: detail?.provisioningSteps,
    quotas: detail?.quotas,
    configYaml: undefined
  };
}

export class StoreController {
  async createStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createStoreSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.errors.map((e) => e.message).join(', '), 400);
      }
      const { name, engine } = parsed.data;
      const userId = (req.headers['x-user-id'] as string) || req.body.userId || null;
      const store = await storeService.createStore({ name, type: engine, userId });
      res.status(202).json({
        message: 'Store provisioning started',
        store: mapStoreToApi(store)
      });
    } catch (e) {
      next(e);
    }
  }

  async getAllStores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string | undefined;
      const stores = await storeService.getAllStores(userId);
      res.json({
        stores: stores.map((s) => mapStoreToApi(s))
      });
    } catch (e) {
      next(e);
    }
  }

  async getStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const store = await storeService.getStoreById(id);
      if (!store) throw new AppError('Store not found', 404);
      const detail = await storeService.getStoreDetail(id);
      res.json({ store: mapStoreToApi(store, detail ?? undefined) });
    } catch (e) {
      next(e);
    }
  }

  async getStoreStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const status = await storeService.getStoreStatus(id);
      if (!status) throw new AppError('Store not found', 404);
      res.json(status);
    } catch (e) {
      next(e);
    }
  }

  async getStoreDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const detail = await storeService.getStoreDetail(id);
      if (!detail) throw new AppError('Store not found', 404);
      res.json(detail);
    } catch (e) {
      next(e);
    }
  }

  async retryStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const store = await storeService.retryStore(id);
      res.status(202).json({
        message: 'Store retry started',
        store: mapStoreToApi(store)
      });
    } catch (e) {
      next(e);
    }
  }

  async deleteStore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await storeService.deleteStore(id);
      res.json({ message: 'Store deleted successfully' });
    } catch (e) {
      next(e);
    }
  }
}

export default new StoreController();
