import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { storageService } from '../services/storage.service';
import { AppError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../types/auth.types';

export class ResumeController {
  public get = async (_req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resume = await prisma.resume.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({
        success: true,
        data: resume
      });
    } catch (error) {
      next(error);
    }
  };

  public upload = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const file = req.file;
      if (file.mimetype !== 'application/pdf') {
        throw new AppError('Only PDF files are allowed', 400);
      }

      const username = req.user?.username || 'admin';

      // Find previous resume record to replace
      const oldResume = await prisma.resume.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      // Upload new file using existing upload pipeline
      const uploadResult = await storageService.upload(
        file.buffer,
        file.originalname,
        file.mimetype,
        username
      );

      // Save record to DB
      const newResume = await prisma.resume.create({
        data: {
          url: uploadResult.url,
          filename: uploadResult.filename,
          s3Key: uploadResult.id,
        }
      });

      // Automatically replace the previous active CV: delete old file from bucket and DB
      if (oldResume) {
        try {
          await storageService.delete(oldResume.s3Key);
          await prisma.resume.delete({
            where: { id: oldResume.id }
          });
        } catch (delError) {
          console.error("Failed to clean up old resume file:", delError);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Resume uploaded successfully',
        data: newResume
      });
    } catch (error) {
      next(error);
    }
  };
}

export const resumeController = new ResumeController();
