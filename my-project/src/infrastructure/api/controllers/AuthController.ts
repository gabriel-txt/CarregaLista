import { Request, Response, NextFunction } from 'express';
import AuthUseCase from '../../../application/use-cases/AuthUseCase';

const authUseCase = new AuthUseCase();

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authUseCase.register(req.body);
      return res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const token = await authUseCase.login(req.body);
      return res.status(200).json({ token });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
