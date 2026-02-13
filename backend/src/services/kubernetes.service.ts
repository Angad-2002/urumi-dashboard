import * as k8s from '@kubernetes/client-node';
import logger from '../utils/logger';

export class KubernetesService {
  private coreApi: k8s.CoreV1Api;
  private appsApi: k8s.AppsV1Api;
  private networkingApi: k8s.NetworkingV1Api;

  constructor() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    this.coreApi = kc.makeApiClient(k8s.CoreV1Api);
    this.appsApi = kc.makeApiClient(k8s.AppsV1Api);
    this.networkingApi = kc.makeApiClient(k8s.NetworkingV1Api);
  }

  async createNamespace(name: string): Promise<void> {
    try {
      await this.coreApi.createNamespace({
        metadata: {
          name,
          labels: {
            'app.kubernetes.io/managed-by': 'store-weaver',
            'store-weaver.io/store': name
          }
        }
      });
      logger.info('Namespace created', { namespace: name });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; message?: string };
      if (e.statusCode === 409) {
        logger.warn('Namespace already exists', { namespace: name });
        return;
      }
      throw err;
    }
  }

  async deleteNamespace(name: string): Promise<void> {
    try {
      await this.coreApi.deleteNamespace(name);
      logger.info('Namespace deleted', { namespace: name });
    } catch (err: unknown) {
      const e = err as { statusCode?: number };
      if (e.statusCode === 404) return;
      throw err;
    }
  }

  async namespaceExists(name: string): Promise<boolean> {
    try {
      await this.coreApi.readNamespace(name);
      return true;
    } catch (err: unknown) {
      const e = err as { statusCode?: number };
      if (e.statusCode === 404) return false;
      throw err;
    }
  }

  async getDeploymentStatus(namespace: string, name: string): Promise<boolean> {
    try {
      const res = await this.appsApi.readNamespacedDeployment(name, namespace);
      const ready = res.body.status?.readyReplicas ?? 0;
      const desired = res.body.spec?.replicas ?? 0;
      return ready === desired && ready > 0;
    } catch (err: unknown) {
      const e = err as { statusCode?: number };
      if (e.statusCode === 404) return false;
      throw err;
    }
  }

  async getStatefulSetStatus(namespace: string, name: string): Promise<boolean> {
    try {
      const res = await this.appsApi.readNamespacedStatefulSet(name, namespace);
      const ready = res.body.status?.readyReplicas ?? 0;
      const desired = res.body.spec?.replicas ?? 0;
      return ready === desired && ready > 0;
    } catch (err: unknown) {
      const e = err as { statusCode?: number };
      if (e.statusCode === 404) return false;
      throw err;
    }
  }

  async areAllPodsReady(namespace: string): Promise<boolean> {
    try {
      const res = await this.coreApi.listNamespacedPod(namespace);
      const pods = res.body.items;
      if (pods.length === 0) return false;
      return pods.every((p) => {
        const ready = p.status?.conditions?.find((c) => c.type === 'Ready');
        return ready?.status === 'True';
      });
    } catch {
      return false;
    }
  }

  async getIngressHost(namespace: string, name: string): Promise<string | null> {
    try {
      const res = await this.networkingApi.readNamespacedIngress(name, namespace);
      return res.body.spec?.rules?.[0]?.host ?? null;
    } catch (err: unknown) {
      const e = err as { statusCode?: number };
      if (e.statusCode === 404) return null;
      throw err;
    }
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      await this.coreApi.listNamespace();
      return true;
    } catch {
      return false;
    }
  }

  async listNamespaceResources(namespace: string): Promise<
    Array<{ kind: string; name: string; status: string; replicas?: string; age: string }>
  > {
    const resources: Array<{ kind: string; name: string; status: string; replicas?: string; age: string }> = [];
    const now = Date.now();
    const age = (date: string) => {
      const t = new Date(date).getTime();
      const d = Math.floor((now - t) / 1000);
      if (d < 60) return `${d}s`;
      if (d < 3600) return `${Math.floor(d / 60)}m`;
      if (d < 86400) return `${Math.floor(d / 3600)}h`;
      return `${Math.floor(d / 86400)}d`;
    };

    try {
      const [deployments, statefulSets, services, pods, pvcs] = await Promise.all([
        this.appsApi.listNamespacedDeployment(namespace).catch(() => ({ body: { items: [] } })),
        this.appsApi.listNamespacedStatefulSet(namespace).catch(() => ({ body: { items: [] } })),
        this.coreApi.listNamespacedService(namespace).catch(() => ({ body: { items: [] } })),
        this.coreApi.listNamespacedPod(namespace).catch(() => ({ body: { items: [] } })),
        this.coreApi.listNamespacedPersistentVolumeClaim(namespace).catch(() => ({ body: { items: [] } }))
      ]);

      deployments.body.items.forEach((d) => {
        const ready = d.status?.readyReplicas ?? 0;
        const desired = d.spec?.replicas ?? 0;
        resources.push({
          kind: 'Deployment',
          name: d.metadata?.name ?? '',
          status: ready === desired && desired > 0 ? 'Running' : 'Pending',
          replicas: `${ready}/${desired}`,
          age: d.metadata?.creationTimestamp ? age(d.metadata.creationTimestamp) : ''
        });
      });
      statefulSets.body.items.forEach((s) => {
        const ready = s.status?.readyReplicas ?? 0;
        const desired = s.spec?.replicas ?? 0;
        resources.push({
          kind: 'StatefulSet',
          name: s.metadata?.name ?? '',
          status: ready === desired && desired > 0 ? 'Running' : 'Pending',
          replicas: `${ready}/${desired}`,
          age: s.metadata?.creationTimestamp ? age(s.metadata.creationTimestamp) : ''
        });
      });
      services.body.items.forEach((s) => {
        resources.push({
          kind: 'Service',
          name: s.metadata?.name ?? '',
          status: 'Active',
          age: s.metadata?.creationTimestamp ? age(s.metadata.creationTimestamp) : ''
        });
      });
      pvcs.body.items.forEach((p) => {
        const phase = p.status?.phase ?? 'Pending';
        resources.push({
          kind: 'PVC',
          name: p.metadata?.name ?? '',
          status: phase === 'Bound' ? 'Bound' : 'Pending',
          age: p.metadata?.creationTimestamp ? age(p.metadata.creationTimestamp) : ''
        });
      });
    } catch {
      // return empty on error
    }
    return resources;
  }

  async listNamespaceEvents(namespace: string): Promise<
    Array<{ timestamp: string; message: string; type: 'Normal' | 'Warning' | 'Error' }>
  > {
    try {
      const res = await this.coreApi.listNamespacedEvent(
        namespace,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        50
      );
      const items = (res.body as { items?: Array<{ lastTimestamp?: string; message?: string; reason?: string; type?: string }> }).items ?? [];
      return items.map((e) => ({
        timestamp: e.lastTimestamp
          ? new Date(e.lastTimestamp).toLocaleTimeString('en-GB', { hour12: false }).slice(0, 8)
          : '',
        message: e.message ?? e.reason ?? '',
        type: (e.type === 'Warning' ? 'Warning' : e.type === 'Error' ? 'Error' : 'Normal') as
          | 'Normal'
          | 'Warning'
          | 'Error'
      }));
    } catch {
      return [];
    }
  }

  /** Sum of container restart counts for all pods in the namespace */
  async getNamespacePodRestarts(namespace: string): Promise<number> {
    try {
      const res = await this.coreApi.listNamespacedPod(namespace);
      let total = 0;
      res.body.items.forEach((pod) => {
        pod.status?.containerStatuses?.forEach((cs) => {
          total += cs.restartCount ?? 0;
        });
      });
      return total;
    } catch {
      return 0;
    }
  }

  /** Resource usage: requested CPU/Memory from pod specs, PVC capacity. Limits from chart defaults. */
  async getNamespaceResourceUsage(namespace: string): Promise<{
    cpuRequested: string;
    memRequested: string;
    pvcCapacity: string;
  }> {
    let cpuM = 0;
    let memMi = 0;
    let pvcGi = 0;
    try {
      const [podsRes, pvcsRes] = await Promise.all([
        this.coreApi.listNamespacedPod(namespace),
        this.coreApi.listNamespacedPersistentVolumeClaim(namespace)
      ]);
      podsRes.body.items.forEach((pod) => {
        pod.spec?.containers?.forEach((c) => {
          const req = c.resources?.requests;
          if (req?.cpu) {
            const s = String(req.cpu);
            if (s.endsWith('m')) cpuM += parseInt(s, 10) || 0;
            else cpuM += (parseFloat(s) || 0) * 1000;
          }
          if (req?.memory) {
            const s = String(req.memory);
            if (s.endsWith('Mi')) memMi += parseInt(s, 10) || 0;
            else if (s.endsWith('Gi')) memMi += (parseInt(s, 10) || 0) * 1024;
            else if (s.endsWith('Ki')) memMi += Math.floor((parseInt(s, 10) || 0) / 1024);
            else memMi += Math.floor((parseInt(s, 10) || 0) / (1024 * 1024));
          }
        });
      });
      pvcsRes.body.items.forEach((pvc) => {
        const cap = (pvc.status as { capacity?: { storage?: string } } | undefined)?.capacity?.storage;
        if (cap) {
          const s = String(cap);
          if (s.endsWith('Gi')) pvcGi += parseInt(s, 10) || 0;
          else if (s.endsWith('Mi')) pvcGi += (parseInt(s, 10) || 0) / 1024;
          else if (s.endsWith('Ti')) pvcGi += (parseInt(s, 10) || 0) * 1024;
        }
      });
    } catch {
      // leave zeros
    }
    return {
      cpuRequested: `${cpuM}m`,
      memRequested: `${memMi}Mi`,
      pvcCapacity: `${pvcGi}Gi`
    };
  }

  /** Whether namespace has an Ingress (used for provisioning steps). */
  async hasIngress(namespace: string): Promise<boolean> {
    try {
      const res = await this.networkingApi.listNamespacedIngress(namespace);
      return (res.body.items?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }

  /** Whether namespace has at least one Secret (used for provisioning steps). */
  async hasSecrets(namespace: string): Promise<boolean> {
    try {
      const res = await this.coreApi.listNamespacedSecret(namespace);
      return (res.body.items?.length ?? 0) > 0;
    } catch {
      return false;
    }
  }
}

export default new KubernetesService();
