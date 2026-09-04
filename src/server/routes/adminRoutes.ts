import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get Admin Analytics Dashboard
router.get('/analytics', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const analytics = db.getAnalytics();
    const usersCount = db.getUsers().length;
    const videosCount = db.getVideos().length;
    res.json({ ...analytics, usersCount, videosCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin analytics.' });
  }
});

// Get All Users for Admin
router.get('/users', requireAuth, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const users = db.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Get All Videos for Admin
router.get('/videos', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const videos = db.getVideos();
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch videos.' });
  }
});

// Get Reports
router.get('/reports', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    // Sample report for demo
    const reports = [
      {
        _id: 'rep-1',
        reporterId: 'user-guest',
        reporterName: 'Alex Rivera',
        targetId: 'vid-short-2',
        targetType: 'video',
        reason: 'Misleading metadata',
        details: 'Title says 100% test coverage but is a speedrun meme video.',
        status: 'reviewed',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      }
    ];
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

// Get System Storage Usage
router.get('/storage', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({
    totalCapacityGb: 1000,
    usedCapacityGb: 142.8,
    videoFilesGb: 130.5,
    thumbnailsGb: 8.2,
    databaseGb: 4.1,
  });
});

// Admin Delete User
router.delete('/users/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const deleted = db.deleteUser(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'User not found or already deleted.' });
      return;
    }
    res.json({ message: 'User deleted successfully.', deletedId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Admin Delete All Videos
router.delete('/videos/all', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const deletedCount = db.deleteAllVideos();
    res.json({ message: 'All videos deleted successfully.', deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete all videos.' });
  }
});

// Admin Delete Video
router.delete('/videos/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const deleted = db.deleteVideo(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Video not found or already deleted.' });
      return;
    }
    res.json({ message: 'Video deleted successfully.', deletedId: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete video.' });
  }
});

export default router;
