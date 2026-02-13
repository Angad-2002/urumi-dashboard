import path from 'path';
import { execCommand } from '../utils/exec';
import logger from '../utils/logger';

/** Escape a value for safe use in shell single-quoted string (e.g. for helm --set). */
function shellEscape(val: string): string {
  return "'" + String(val).replace(/'/g, "'\\''") + "'";
}

export interface HelmValues {
  storeId: string;
  dbPassword: string;
  wpAdminPassword: string;
  ingressHost: string;
}

export interface MedusaHelmValues {
  storeName: string;
  storeId: string;
  ingressHost: string;
  postgresPassword: string;
  adminEmail: string;
  adminPassword: string;
  jwtSecret: string;
  cookieSecret: string;
  seedDemoData?: boolean;
}

export class HelmService {
  private chartPath: string;
  private medusaChartPath: string;

  constructor() {
    this.chartPath = path.resolve(
      __dirname,
      process.env.HELM_CHART_PATH || '../../../helm/store'
    );
    this.medusaChartPath = path.resolve(
      __dirname,
      process.env.HELM_CHART_PATH_MEDUSA || '../../../helm/medusa-store'
    );
    logger.info('Helm service initialized', { chartPath: this.chartPath, medusaChartPath: this.medusaChartPath });
  }

  async install(
    releaseName: string,
    namespace: string,
    values: HelmValues
  ): Promise<void> {
    const valuesFile =
      process.env.ENVIRONMENT === 'production' ? 'values-prod.yaml' : 'values-local.yaml';
    const valuesFilePath = path.join(this.chartPath, valuesFile);

    const valuesArg = valuesFilePath.includes(' ') ? `"${valuesFilePath}"` : valuesFilePath;
    const args = [
      'helm',
      'install',
      releaseName,
      this.chartPath,
      '--namespace',
      namespace,
      '--create-namespace',
      '--values',
      valuesArg,
      '--set',
      `storeId=${values.storeId}`,
      '--set',
      `wordpress.adminPassword=${values.wpAdminPassword}`,
      '--set',
      `mysql.auth.rootPassword=${values.dbPassword}`,
      '--set',
      `mysql.auth.password=${values.dbPassword}`,
      '--set',
      `ingress.hosts[0].host=${values.ingressHost}`,
      '--wait',
      '--timeout',
      '5m'
    ];
    const command = args.join(' ');

    logger.info('Installing Helm chart', { releaseName, namespace, valuesFile });

    try {
      await execCommand(command, { timeout: 360000 });
      logger.info('Helm chart installed', { releaseName, namespace });
    } catch (err: unknown) {
      const e = err as { stderr?: string; message?: string };
      throw new Error(`Helm install failed: ${e.stderr ?? e.message}`);
    }
  }

  async installMedusa(
    releaseName: string,
    namespace: string,
    values: MedusaHelmValues
  ): Promise<void> {
    const valuesFile =
      process.env.ENVIRONMENT === 'production' ? 'values-prod.yaml' : 'values-local.yaml';
    const valuesFilePath = path.join(this.medusaChartPath, valuesFile);
    const valuesArg = valuesFilePath.includes(' ') ? `"${valuesFilePath}"` : valuesFilePath;

    const args = [
      'helm',
      'install',
      releaseName,
      this.medusaChartPath,
      '--namespace',
      namespace,
      '--create-namespace',
      '--values',
      valuesArg,
      '--set',
      `storeName=${values.storeName}`,
      '--set',
      `storeId=${values.storeId}`,
      '--set',
      `ingress.host=${values.ingressHost}`,
      '--set',
      `postgres.password=${shellEscape(values.postgresPassword)}`,
      '--set',
      `medusa.adminEmail=${shellEscape(values.adminEmail)}`,
      '--set',
      `medusa.adminPassword=${shellEscape(values.adminPassword)}`,
      '--set',
      `medusa.jwtSecret=${shellEscape(values.jwtSecret)}`,
      '--set',
      `medusa.cookieSecret=${shellEscape(values.cookieSecret)}`,
      '--set',
      `medusa.seedDemoData=${values.seedDemoData ?? true}`,
      '--wait',
      '--timeout',
      '10m'
    ];
    const command = args.join(' ');

    logger.info('Installing Medusa Helm chart', { releaseName, namespace, valuesFile });

    try {
      await execCommand(command, { timeout: 600000 });
      logger.info('Medusa Helm chart installed', { releaseName, namespace });
    } catch (err: unknown) {
      const e = err as { stderr?: string; message?: string };
      throw new Error(`Helm install failed: ${e.stderr ?? e.message}`);
    }
  }

  async uninstall(releaseName: string, namespace: string): Promise<void> {
    const command = [
      'helm',
      'uninstall',
      releaseName,
      '--namespace',
      namespace,
      '--wait',
      '--timeout',
      '3m'
    ].join(' ');

    logger.info('Uninstalling Helm chart', { releaseName, namespace });

    try {
      await execCommand(command, { timeout: 240000 });
      logger.info('Helm chart uninstalled', { releaseName, namespace });
    } catch (err: unknown) {
      const e = err as { stderr?: string; message?: string };
      throw new Error(`Helm uninstall failed: ${e.stderr ?? e.message}`);
    }
  }

  async checkHelm(): Promise<boolean> {
    try {
      await execCommand('helm version');
      return true;
    } catch {
      return false;
    }
  }
}

export default new HelmService();
