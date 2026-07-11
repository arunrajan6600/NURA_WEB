import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTPayload, AuthUser } from '../types/auth.types';

export class AuthService {
  /**
   * Validates user credentials and signs a JWT if credentials match.
   */
  public async login(username: string, password: string): Promise<string | null> {
    if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
      return null;
    }

    const payload: JWTPayload = {
      username,
      isAdmin: true,
    };

    // Sign the token with a 24-hour expiration
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '24h',
      algorithm: 'HS256',
    });
  }

  /**
   * Verifies the authenticity and expiration of a JWT token.
   */
  public async verifyToken(token: string): Promise<AuthUser> {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    if (!decoded.username || decoded.isAdmin !== true) {
      throw new Error('Invalid token payload');
    }

    return {
      username: decoded.username,
      role: 'admin',
    };
  }
}

export const authService = new AuthService();
