import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get Notifications
router.get('/', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const notifs = db.getNotifications(req.user._id);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// Mark Notification as Read
router.put('/:id/read', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    db.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

export default router;
