import { Router } from 'express';
import AuthController from './controllers/AuthController';
import OrderUploadController from './controllers/OrderUploadController';
import StockReplenishmentController from './controllers/StockReplenishmentController';
import ensureAuthenticated from './middlewares/ensureAuthenticated';
import uploadMiddleware from './middlewares/uploadMiddleware';

const router = Router();

router.post('/api/auth/register', AuthController.register);
router.post('/api/auth/login', AuthController.login);

router.post('/api/pedidos/upload', ensureAuthenticated, uploadMiddleware.single('file'), OrderUploadController.upload);
router.post('/api/estoque/reposicao', ensureAuthenticated, uploadMiddleware.single('file'), StockReplenishmentController.replenish);

router.get('/api/pedidos/list', ensureAuthenticated, OrderUploadController.list);
router.get('/api/pedidos/detail/:id', ensureAuthenticated, OrderUploadController.detail);
router.get('/api/estoque/stockList', ensureAuthenticated, StockReplenishmentController.stockList);
router.get('/api/estoque/movements', ensureAuthenticated, StockReplenishmentController.movements);
router.get('/api/estoque/purchaseList', ensureAuthenticated, StockReplenishmentController.purchaseList);

export default router;
