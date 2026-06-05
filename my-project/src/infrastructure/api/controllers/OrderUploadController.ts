import { Request, Response, NextFunction } from 'express';
import UploadOrdersUseCase from '../../../application/use-cases/UploadOrdersUseCase';
import ProcessOrdersUseCase from '../../../application/use-cases/ProcessOrdersUseCase';

const uploadOrdersUseCase = new UploadOrdersUseCase();
const processOrdersUseCase = new ProcessOrdersUseCase();

class OrderUploadController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'File is required' });
      }

      const batchId = await uploadOrdersUseCase.execute(req.file.buffer.toString('utf-8'));
      processOrdersUseCase.schedule(batchId);

      return res.status(202).json({ message: 'Arquivo aceito. Processamento iniciado em background.', batchId });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await uploadOrdersUseCase.listOrders();
      return res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await uploadOrdersUseCase.getOrderById(Number(req.params.id));
      return res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderUploadController();
