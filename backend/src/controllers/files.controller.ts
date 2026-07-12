import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { storageService } from '../services/storage.service';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../types/auth.types';

const presignedUrlSchema = z.object({
  filename: z.string().min(1, 'filename is required'),
  contentType: z.string().min(1, 'contentType is required'),
  size: z.coerce.number().int().positive('size must be positive'),
});

const ALLOWED_TYPES = [
  'image/',
  'video/',
  'audio/',
  'application/pdf',
  'text/',
];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const validateFileAttrs = (contentType: string, size: number) => {
  if (size > MAX_SIZE) {
    throw new AppError(`File size exceeds 50MB limit`, 400);
  }

  const isAllowed = ALLOWED_TYPES.some((type) => contentType.startsWith(type));
  if (!isAllowed) {
    throw new AppError(`File type ${contentType} not allowed`, 400);
  }
};

export class FilesController {
  /**
   * GET /files
   */
  public list = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = await storageService.list();
      res.status(200).json(files);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /files/upload
   */
  public upload = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const file = req.file;
      const username = req.user?.username || 'admin';

      // Validate mimetype & size
      validateFileAttrs(file.mimetype, file.size);

      // Perform upload
      const result = await storageService.upload(
        file.buffer,
        file.originalname,
        file.mimetype,
        username
      );

      res.status(201).json({
        message: 'Files uploaded successfully',
        files: [result],
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /files/presigned-url
   */
  public getPresignedUrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = presignedUrlSchema.safeParse(req.body);

      if (!parseResult.success) {
        const issues = parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        throw new AppError(issues || 'Invalid request body', 400);
      }

      const { filename, contentType, size } = parseResult.data;
      const username = req.user?.username || 'admin';

      // Validate
      validateFileAttrs(contentType, size);

      // Generate url
      const result = await storageService.createSignedUploadUrl(
        filename,
        contentType,
        size,
        username
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /files/:id
   */
  public remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const fileId = req.params.id;

      if (!fileId) {
        throw new AppError('File ID is required', 400);
      }

      await storageService.delete(fileId);

      res.status(200).json({
        message: 'File deleted successfully',
        fileId: fileId,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /files/:id/rename
   */
  public rename = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const fileId = req.params.id;
      const { newName } = req.body;

      if (!fileId) {
        throw new AppError('File ID is required', 400);
      }
      if (!newName || typeof newName !== 'string') {
        throw new AppError('newName string is required', 400);
      }

      await storageService.rename(fileId, newName);

      res.status(200).json({
        success: true,
        message: 'File renamed successfully',
        fileId,
        newName
      });
    } catch (error) {
      next(error);
    }
  };
}

export const filesController = new FilesController();
