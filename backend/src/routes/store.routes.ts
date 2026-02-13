import { Router } from 'express';
import storeController from '../controllers/store.controller';

const router = Router();

router.post('/', (req, res, next) => storeController.createStore(req, res, next));
router.get('/', (req, res, next) => storeController.getAllStores(req, res, next));
router.get('/:id', (req, res, next) => storeController.getStore(req, res, next));
router.get('/:id/status', (req, res, next) => storeController.getStoreStatus(req, res, next));
router.get('/:id/detail', (req, res, next) => storeController.getStoreDetail(req, res, next));
router.post('/:id/retry', (req, res, next) => storeController.retryStore(req, res, next));
router.delete('/:id', (req, res, next) => storeController.deleteStore(req, res, next));

export default router;
