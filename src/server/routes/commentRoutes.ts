import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get comments for a video
router.get('/:videoId', (req, res: Response) => {
  try {
    const comments = db.getCommentsByVideoId(req.params.videoId);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// Create comment
router.post('/:videoId', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { text } = req.body;
    if (!text || text.trim() === '') {
      res.status(400).json({ error: 'Comment text is required.' });
      return;
    }

    const newComment = db.createComment({
      videoId: req.params.videoId,
      user: {
        _id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        avatar: req.user.avatar,
        verified: req.user.verified,
      },
      text,
      isPinned: false,
    });

    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to post comment.' });
  }
});

// Like a comment
router.post('/like/:commentId', optionalAuth, (req, res: Response): void => {
  try {
    const updated = db.likeComment(req.params.commentId);
    if (!updated) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to like comment.' });
  }
});

// Delete comment
router.delete('/:commentId', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const deleted = db.deleteComment(req.params.commentId);
    if (!deleted) {
      res.status(404).json({ error: 'Comment not found or already deleted.' });
      return;
    }
    res.json({ message: 'Comment deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

export default router;
