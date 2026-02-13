import { Router } from 'express';
import storeRoutes from './store.routes';
import healthRoutes from './health.routes';

const routes = Router();
routes.use('/stores', storeRoutes);
routes.use('/health', healthRoutes);
export { routes };
