import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../infrastructure/prisma/client';
import { RegisterUserSchema, LoginSchema } from '../dto/validation/authSchemas';

class AuthUseCase {
  async register(payload: unknown) {
    const data = RegisterUserSchema.parse(payload);
    const hashedPassword = await bcryptjs.hash(data.password, 8);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(payload: unknown) {
    const data = LoginSchema.parse(payload);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    const passwordMatches = await bcryptjs.compare(data.password, user.password);
    if (!passwordMatches) {
      throw new Error('Credenciais inválidas');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET não configurado');
    }

    const options = {
      subject: String(user.id),
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    } as jwt.SignOptions;

    const token = jwt.sign(
      { email: user.email },
      secret as jwt.Secret,
      options,
    );

    return token;
  }
}

export default AuthUseCase;
