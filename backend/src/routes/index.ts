import { Router } from 'express';

const router = Router();

// GET /health - basic system sanity check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok'
  });
});

export default router;
