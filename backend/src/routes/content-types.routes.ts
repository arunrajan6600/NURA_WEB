import { Router } from 'express';
import { contentTypesController } from '../controllers/content-types.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /content-types - Publicly accessible
router.get('/', contentTypesController.list);

// Protected routes requiring authentication
router.post('/', authMiddleware as any, contentTypesController.create);
router.put('/:slug', authMiddleware as any, contentTypesController.update);
router.delete('/:slug', authMiddleware as any, contentTypesController.remove);

export default router;
