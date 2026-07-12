import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /settings - Publicly accessible
router.get('/', settingsController.get);

// PUT /settings - Protected by JWT Auth
router.put('/', authMiddleware as any, settingsController.update);

export default router;
