import { Router } from 'express';
import { postsController } from '../controllers/posts.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', postsController.list);
router.get('/:id', postsController.getById);

// Protected routes requiring authentication
router.post('/', authMiddleware as any, postsController.create);
router.put('/:id', authMiddleware as any, postsController.update);
router.delete('/:id', authMiddleware as any, postsController.remove);

export default router;
