import { Router } from 'express';
import multer from 'multer';
import { resumeController } from '../controllers/resume.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// GET /resume - Retrieve latest active resume
router.get('/', resumeController.get);

// POST /resume - Upload a new resume PDF (Admin only)
router.post('/', authMiddleware as any, upload.single('file'), resumeController.upload);

export default router;
