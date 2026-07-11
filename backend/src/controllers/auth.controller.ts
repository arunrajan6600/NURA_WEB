import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types/auth.types';
import { AppError } from '../middleware/error.middleware';

const loginSchema = z.object({
  username: z.string({ required_error: 'Username is required' }).min(1, 'Username is required'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export class AuthController {
  /**
   * Handles admin login request.
   */
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = loginSchema.safeParse(req.body);

      if (!parseResult.success) {
        // Return 400 Bad Request for malformed input
        const issues = parseResult.error.issues.map((i) => i.message).join(', ');
        throw new AppError(issues || 'Invalid request body', 400);
      }

      const { username, password } = parseResult.data;
      const token = await authService.login(username, password);

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
        return;
      }

      res.status(200).json({
        success: true,
        token,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles verify token request.
   * Returns exact format required by the frontend client.
   */
  public verify = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ valid: false });
        return;
      }

      const token = authHeader.substring(7);
      
      try {
        const user = await authService.verifyToken(token);
        res.status(200).json({
          valid: true,
          user,
        });
      } catch {
        res.status(401).json({ valid: false });
      }
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
