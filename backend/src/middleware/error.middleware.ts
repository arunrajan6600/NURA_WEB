import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err instanceof AppError ? err.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  // Map known database errors (Prisma errors) to user-friendly HTTP statuses
  if (err && typeof err === 'object' && 'name' in err) {
    if (err.name === 'PrismaClientKnownRequestError') {
      const prismaError = err as any;
      if (prismaError.code === 'P2002') {
        statusCode = 409; // Conflict
        const targets = prismaError.meta?.target;
        const fields = Array.isArray(targets) ? targets.join(', ') : String(targets || '');
        message = fields 
          ? `A record with this unique value for field(s) (${fields}) already exists` 
          : 'Unique constraint failed on the database.';
      } else if (prismaError.code === 'P2025') {
        statusCode = 404; // Not Found
        message = prismaError.meta?.cause || 'Requested database record not found.';
      }
    }
  }

  // Log error (especially 500s)
  if (statusCode === 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
  } else {
    console.warn(`[WARN] ${req.method} ${req.originalUrl}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
