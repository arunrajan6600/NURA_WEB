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

// Posts endpoints
import postsRoutes from './posts.routes';
router.use('/posts', postsRoutes);

// Files endpoints
import filesRoutes from './files.routes';
router.use('/files', filesRoutes);

// Settings endpoints
import settingsRoutes from './settings.routes';
router.use('/settings', settingsRoutes);

// Resume endpoints
import resumeRoutes from './resume.routes';
router.use('/resume', resumeRoutes);

export default router;
