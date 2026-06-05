import { Request, Response, NextFunction } from 'express';
import UploadStockReplenishmentUseCase from '../../../application/use-cases/UploadStockReplenishmentUseCase';

const uploadStockReplenishmentUseCase = new UploadStockReplenishmentUseCase();

class StockReplenishmentController {
  async replenish(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'File is required' });
      }

      await uploadStockReplenishmentUseCase.execute(req.file.buffer.toString('utf-8'));
      return res.status(202).json({ message: 'Processamento de reposição iniciado.' });
    } catch (error) {
      next(error);
    }
  }

  async stockList(req: Request, res: Response, next: NextFunction) {
    try {
      const stock = await uploadStockReplenishmentUseCase.listStock();
      return res.status(200).json(stock);
    } catch (error) {
      next(error);
    }
  }

  async movements(req: Request, res: Response, next: NextFunction) {
    try {
      const movements = await uploadStockReplenishmentUseCase.listMovements();
      return res.status(200).json(movements);
    } catch (error) {
      next(error);
    }
  }

  async purchaseList(req: Request, res: Response, next: NextFunction) {
    try {
      const purchases = await uploadStockReplenishmentUseCase.listPurchases();
      return res.status(200).json(purchases);
    } catch (error) {
      next(error);
    }
  }
}

export default new StockReplenishmentController();
