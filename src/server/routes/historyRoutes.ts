import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get Watch History
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const history = db.getHistory(req.user._id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch watch history.' });
  }
});

// Clear Watch History
router.delete('/', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    db.clearHistory(req.user._id);
    res.json({ message: 'Watch history cleared successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear watch history.' });
  }
});

// Remove Single Video from Watch History
router.delete('/:videoId', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    db.removeFromHistory(req.user._id, req.params.videoId);
    res.json({ message: 'Video removed from watch history.', videoId: req.params.videoId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove video from history.' });
  }
});

export default router;
