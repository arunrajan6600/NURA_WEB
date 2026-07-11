import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// GET /health - basic system sanity check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok'
  });
});

// Auth endpoints
router.use('/auth', authRoutes);

export default router;
