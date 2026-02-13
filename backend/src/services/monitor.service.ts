import kubernetesService from './kubernetes.service';
import logger from '../utils/logger';

const POLL_INTERVAL_MS = 5000;

export interface MonitorOptions {
  timeout: number;
  pollInterval?: number;
  storeType?: 'woocommerce' | 'medusa';
  storeId?: string;
}

export class MonitorService {
  async waitForReady(namespace: string, options: MonitorOptions): Promise<boolean> {
    const start = Date.now();
    const interval = options.pollInterval ?? POLL_INTERVAL_MS;

    logger.info('Starting readiness check', { namespace, timeout: options.timeout, storeType: options.storeType });

    while (Date.now() - start < options.timeout) {
      if (await this.checkReadiness(namespace, options.storeType ?? 'woocommerce', options.storeId)) {
        logger.info('Store ready', { namespace, duration: Date.now() - start });
        return true;
      }
      await this.sleep(interval);
    }

    logger.warn('Readiness timeout', { namespace, timeout: options.timeout });
    return false;
  }

  private async checkReadiness(
    namespace: string,
    storeType: 'woocommerce' | 'medusa',
    storeId?: string
  ): Promise<boolean> {
    try {
      if (!(await kubernetesService.namespaceExists(namespace))) return false;

      if (storeType === 'medusa' && storeId) {
        const deployName = `${storeId}-medusa`;
        const stsName = `${storeId}-postgres`;
        const ingressName = `${storeId}-ingress`;
        if (!(await kubernetesService.getDeploymentStatus(namespace, deployName))) return false;
        if (!(await kubernetesService.getStatefulSetStatus(namespace, stsName))) return false;
        if (!(await kubernetesService.areAllPodsReady(namespace))) return false;
        const host = await kubernetesService.getIngressHost(namespace, ingressName);
        if (!host) return false;
        const { default: axios } = await import('axios');
        const res = await axios.get(`http://${host}/health`, {
          timeout: 5000,
          validateStatus: (s) => s < 500
        });
        return res.status < 500;
      }

      if (!(await kubernetesService.getDeploymentStatus(namespace, 'wordpress'))) return false;
      if (!(await kubernetesService.getStatefulSetStatus(namespace, 'mysql'))) return false;
      if (!(await kubernetesService.areAllPodsReady(namespace))) return false;

      const host = await kubernetesService.getIngressHost(namespace, 'wordpress-ingress');
      if (!host) return false;

      const { default: axios } = await import('axios');
      const res = await axios.get(`http://${host}`, {
        timeout: 5000,
        validateStatus: (s) => s < 500,
        maxRedirects: 5
      });
      return res.status < 500;
    } catch {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export default new MonitorService();
