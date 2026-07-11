import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types/auth.types';
import { AppError } from './error.middleware';

export const authMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);

    // Attach verified user to request object
    req.user = user;
    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      return next(error);
    }

    // Capture expired or malformed JWT errors
    const errorMessage = error.name === 'TokenExpiredError' 
      ? 'Token expired' 
      : 'Invalid token';

    next(new AppError(errorMessage, 401));
  }
};
