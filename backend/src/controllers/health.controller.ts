import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import kubernetesService from '../services/kubernetes.service';
import helmService from '../services/helm.service';

export async function health(_req: Request, res: Response, _next: NextFunction): Promise<void> {
  const checks: Record<string, boolean> = {
    database: false,
    kubernetes: false,
    helm: false
  };

  try {
    await db.raw('SELECT 1');
    checks.database = true;
  } catch {
    // leave false
  }

  try {
    checks.kubernetes = await kubernetesService.checkConnectivity();
  } catch {
    // leave false
  }

  try {
    checks.helm = await helmService.checkHelm();
  } catch {
    // leave false
  }

  const healthy = checks.database;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  });
}
