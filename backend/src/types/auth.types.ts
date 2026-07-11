import { Request } from 'express';

export interface JWTPayload {
  username: string;
  isAdmin: boolean;
}

export interface AuthUser {
  username: string;
  role: 'admin';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
