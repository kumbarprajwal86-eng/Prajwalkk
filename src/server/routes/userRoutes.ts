import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all creators/channels
router.get('/channels', (req, res: Response) => {
  try {
    const creators = db.getUsers().filter(u => u.role === 'creator' || u.subscribersCount > 0);
    res.json(creators);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch channels.' });
  }
});

// Get Subscribed Channels for current user
router.get('/subscriptions', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const subscribedChannels = db.getUsers().filter(u => req.user?.subscribedTo.includes(u._id));
    res.json(subscribedChannels);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscriptions.' });
  }
});

// Get Videos from Subscribed Channels
router.get('/subscriptions/videos', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const subscribedVideos = db.getVideos().filter(v => {
      const cId = typeof v.creator === 'object' ? v.creator._id : v.creator;
      return req.user?.subscribedTo.includes(cId) && v.visibility === 'public';
    });
    res.json(subscribedVideos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscription videos.' });
  }
});

// Get User Profile by ID or Username
router.get('/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const user = db.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User or channel not found.' });
      return;
    }
    // Get user's public videos and playlists
    const videos = db.getVideos().filter(v => {
      const cId = typeof v.creator === 'object' ? v.creator._id : v.creator;
      if (cId !== user._id) return false;
      if (v.visibility === 'public') return true;
      if (req.user && req.user._id === user._id) return true;
      return false;
    });

    const playlists = db.getPlaylists(user._id);
    res.json({ user, videos, playlists });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// Update Profile
router.put('/profile', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { name, bio, avatar, banner, socialLinks, location } = req.body;
    const updated = db.updateUser(req.user._id, {
      name: name || req.user.name,
      bio: bio !== undefined ? bio : req.user.bio,
      avatar: avatar || req.user.avatar,
      banner: banner !== undefined ? banner : req.user.banner,
      socialLinks: socialLinks || req.user.socialLinks,
      location: location !== undefined ? location : req.user.location,
    });

    // Update channel info in their existing videos
    if (updated) {
      db.getVideos().forEach(v => {
        const cId = typeof v.creator === 'object' ? v.creator._id : v.creator;
        if (cId === updated._id) {
          db.updateVideo(v._id, { channelName: updated.name, channelAvatar: updated.avatar });
        }
      });
    }

    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Delete Account / Profile
router.delete('/profile', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const userId = req.user._id;
    db.deleteUser(userId);
    res.clearCookie('viewpoint_token');
    res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

// Subscribe / Unsubscribe Toggle
router.post('/:id/subscribe', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const targetChannel = db.getUserById(req.params.id);
    if (!targetChannel) {
      res.status(404).json({ error: 'Channel not found.' });
      return;
    }
    if (targetChannel._id === req.user._id) {
      res.status(400).json({ error: 'You cannot subscribe to your own channel.' });
      return;
    }

    const isSubscribed = req.user.subscribedTo.includes(targetChannel._id);
    let updatedSubs = [...req.user.subscribedTo];
    let newSubCount = targetChannel.subscribersCount;

    if (isSubscribed) {
      updatedSubs = updatedSubs.filter(id => id !== targetChannel._id);
      newSubCount = Math.max(0, newSubCount - 1);
    } else {
      updatedSubs.push(targetChannel._id);
      newSubCount += 1;
    }

    const updatedTarget = db.updateUser(targetChannel._id, { subscribersCount: newSubCount });
    const updatedUser = db.updateUser(req.user._id, { subscribedTo: updatedSubs });

    res.json({ isSubscribed: !isSubscribed, subscribersCount: newSubCount, subscribedTo: updatedSubs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle subscription.' });
  }
});

export default router;
