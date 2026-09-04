import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get playlists (all public, or user specific)
router.get('/', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.query.userId ? String(req.query.userId) : (req.user ? req.user._id : undefined);
    const playlists = db.getPlaylists(userId);
    res.json(playlists);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playlists.' });
  }
});

// Get playlist by ID
router.get('/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const playlist = db.getPlaylistById(req.params.id);
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found.' });
      return;
    }
    if (playlist.visibility === 'private' && req.user?._id !== playlist.creator._id) {
      res.status(403).json({ error: 'This playlist is private.' });
      return;
    }
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch playlist details.' });
  }
});

// Create playlist
router.post('/', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { title, description, visibility, videoId } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Playlist title is required.' });
      return;
    }

    let videos = [];
    if (videoId) {
      const vid = db.getVideoById(videoId);
      if (vid) videos.push(vid);
    }

    const newPlaylist = db.createPlaylist({
      title,
      description: description || '',
      thumbnailUrl: videos[0]?.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      creator: {
        _id: req.user._id,
        name: req.user.name,
        username: req.user.username,
        avatar: req.user.avatar,
      },
      videos,
      visibility: visibility || 'public',
    });

    res.status(201).json(newPlaylist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create playlist.' });
  }
});

// Add or remove video from playlist
router.post('/:id/videos', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const playlist = db.getPlaylistById(req.params.id);
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found.' });
      return;
    }
    if (playlist.creator._id !== req.user?._id) {
      res.status(403).json({ error: 'Not authorized to edit this playlist.' });
      return;
    }

    const { videoId } = req.body;
    const video = db.getVideoById(videoId);
    if (!video) {
      res.status(404).json({ error: 'Video not found.' });
      return;
    }

    const existsIdx = playlist.videos.findIndex(v => v._id === videoId);
    let newVideos = [...playlist.videos];
    if (existsIdx !== -1) {
      // Remove it
      newVideos.splice(existsIdx, 1);
    } else {
      // Add it
      newVideos.push(video);
    }

    const updated = db.updatePlaylist(playlist._id, {
      videos: newVideos,
      thumbnailUrl: newVideos[0]?.thumbnailUrl || playlist.thumbnailUrl,
    });

    res.json({ playlist: updated, isAdded: existsIdx === -1 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update playlist videos.' });
  }
});

// Delete playlist
router.delete('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const playlist = db.getPlaylistById(req.params.id);
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found.' });
      return;
    }
    if (playlist.creator._id !== req.user?._id && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized to delete this playlist.' });
      return;
    }

    db.deletePlaylist(playlist._id);
    res.json({ message: 'Playlist deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete playlist.' });
  }
});

export default router;
