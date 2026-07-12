import { Router } from 'express';
import multer from 'multer';
import { filesController } from '../controllers/files.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Multer memory storage configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// Protect all files endpoints using JWT auth middleware
router.use(authMiddleware as any);

// Routes
router.get('/', filesController.list);
router.post('/upload', upload.single('file'), filesController.upload);
router.post('/presigned-url', filesController.getPresignedUrl);
router.delete('/:id', filesController.remove);
router.patch('/:id/rename', filesController.rename);

export default router;
