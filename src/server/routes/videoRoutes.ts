import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { db } from '../db';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { Video, VideoCategory } from '../../types';
import { getEmbedInfo } from '../../utils/videoUtils';

const router = Router();

// Setup Multer Storage for direct video/image file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
const videosDir = path.join(uploadsDir, 'videos');
const thumbsDir = path.join(uploadsDir, 'thumbnails');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, videosDir);
    } else {
      cb(null, thumbsDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, safeName);
  },
});

const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB max
});

// Upload direct media file (Video or Thumbnail image)
router.post('/upload-media', optionalAuth, uploadMiddleware.single('file'), (req: AuthRequest, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No media file provided.' });
      return;
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const subFolder = isVideo ? 'videos' : 'thumbnails';
    const fileUrl = `/uploads/${subFolder}/${req.file.filename}`;

    res.json({
      url: fileUrl,
      fileName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      type: isVideo ? 'video' : 'thumbnail'
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    res.status(500).json({ error: 'Failed to process file upload.' });
  }
});

// Get Videos with Filtering, Sorting, and Search
router.get('/', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { category, search, q, sort, isShort, creatorId, creator, channelId, visibility, tag } = req.query;
    let videos = db.getVideos();

    // Filter by visibility (public only unless creator matches logged in user)
    videos = videos.filter(v => {
      if (!v) return false;
      if (v.visibility === 'public' || !v.visibility) return true;
      const cId = typeof v.creator === 'object' && v.creator ? (v.creator as any)._id : v.creator;
      if (req.user && cId === req.user._id) return true;
      return false;
    });

    if (category && category !== 'All' && category !== 'Trending') {
      videos = videos.filter(v => v.category === category);
    }

    if (isShort !== undefined) {
      const shortVal = isShort === 'true';
      videos = videos.filter(v => Boolean(v.isShort) === shortVal);
    }

    const targetCreator = (creatorId || creator || channelId) as string;
    if (targetCreator) {
      videos = videos.filter(v => {
        const cId = typeof v.creator === 'object' && v.creator ? (v.creator as any)._id : v.creator;
        return cId === targetCreator || v.channelId === targetCreator;
      });
    }

    if (tag) {
      const targetTag = String(tag).toLowerCase();
      videos = videos.filter(v => Array.isArray(v.tags) && v.tags.some(t => (t || '').toLowerCase() === targetTag));
    }

    const searchQuery = (search || q) as string;
    if (searchQuery) {
      const query = String(searchQuery).toLowerCase().trim();
      videos = videos.filter(v => 
        (v.title || '').toLowerCase().includes(query) ||
        (v.description || '').toLowerCase().includes(query) ||
        (v.channelName || '').toLowerCase().includes(query) ||
        (Array.isArray(v.tags) && v.tags.some(t => (t || '').toLowerCase().includes(query))) ||
        (v.category || '').toLowerCase().includes(query)
      );
    }

    // Sort
    if (sort === 'views' || category === 'Trending') {
      videos.sort((a, b) => b.views - a.views);
    } else if (sort === 'likes') {
      videos.sort((a, b) => b.likes - a.likes);
    } else if (sort === 'oldest') {
      videos.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      // Default: newest
      videos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch videos.' });
  }
});

// Get Shorts Feed
router.get('/shorts', (req, res: Response) => {
  try {
    const shorts = db.getVideos().filter(v => v.isShort && v.visibility === 'public');
    res.json(shorts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shorts.' });
  }
});

// Get Trending Videos
router.get('/trending', (req, res: Response) => {
  try {
    const trending = db.getVideos().filter(v => !v.isShort && v.visibility === 'public').sort((a, b) => b.views - a.views).slice(0, 15);
    res.json(trending);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending videos.' });
  }
});

// Get Download for Video File
router.get('/:id/download', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const video = db.getVideoById(req.params.id);
    if (!video) {
      res.status(404).json({ error: 'Video not found or deleted.' });
      return;
    }

    const cleanTitle = (video.title || 'video')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'video';
    const filename = `${cleanTitle}.mp4`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Handle Data URLs (uploaded base64 videos)
    if (video.videoUrl.startsWith('data:')) {
      const matches = video.videoUrl.match(/^data:(video\/[a-zA-Z0-9\-]+|application\/[a-zA-Z0-9\-]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', buffer.length.toString());
        res.send(buffer);
        return;
      }
    }

    // Handle remote http/https URLs
    if (video.videoUrl.startsWith('http://') || video.videoUrl.startsWith('https://')) {
      try {
        const response = await fetch(video.videoUrl);
        if (response.ok) {
          const contentType = response.headers.get('content-type') || 'video/mp4';
          const contentLength = response.headers.get('content-length');
          res.setHeader('Content-Type', contentType);
          if (contentLength) res.setHeader('Content-Length', contentLength);

          const arrayBuffer = await response.arrayBuffer();
          res.send(Buffer.from(arrayBuffer));
          return;
        }
      } catch (e) {
        console.warn('Backend proxy fetch failed, redirecting to videoUrl:', e);
      }
      res.redirect(video.videoUrl);
      return;
    }

    res.redirect(video.videoUrl);
  } catch (err) {
    console.error('Video download route error:', err);
    res.status(500).json({ error: 'Failed to process video download.' });
  }
});

// Get Video by ID
router.get('/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const video = db.getVideoById(req.params.id);
    if (!video) {
      res.status(404).json({ error: 'Video not found.' });
      return;
    }
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch video details.' });
  }
});

// Increment View Count
router.post('/:id/view', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const video = db.getVideoById(req.params.id);
    if (!video) {
      res.status(404).json({ error: 'Video not found.' });
      return;
    }
    const updated = db.updateVideo(video._id, { views: video.views + 1 });
    
    // Add to history if authenticated
    if (req.user && req.body.progress !== undefined) {
      db.addToHistory(req.user._id, video, req.body.progress);
    }
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record view.' });
  }
});

// Like Video Toggle
router.post('/:id/like', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const video = db.getVideoById(req.params.id);
    if (!video || !req.user) {
      res.status(404).json({ error: 'Video or user not found.' });
      return;
    }

    const userId = req.user._id;
    const isLiked = req.user.likedVideos.includes(video._id);
    const isDisliked = req.user.dislikedVideos.includes(video._id);

    let newLikes = video.likes;
    let newDislikes = video.dislikes;
    let updatedLikedVideos = [...req.user.likedVideos];
    let updatedDislikedVideos = [...req.user.dislikedVideos];

    if (isLiked) {
      newLikes = Math.max(0, newLikes - 1);
      updatedLikedVideos = updatedLikedVideos.filter(id => id !== video._id);
    } else {
      newLikes += 1;
      updatedLikedVideos.push(video._id);
      if (isDisliked) {
        newDislikes = Math.max(0, newDislikes - 1);
        updatedDislikedVideos = updatedDislikedVideos.filter(id => id !== video._id);
      }
    }

    const updatedVideo = db.updateVideo(video._id, { likes: newLikes, dislikes: newDislikes });
    db.updateUser(userId, { likedVideos: updatedLikedVideos, dislikedVideos: updatedDislikedVideos });

    res.json({ video: updatedVideo, likedVideos: updatedLikedVideos, dislikedVideos: updatedDislikedVideos });
  } catch (err) {
    res.status(500).json({ error: 'Failed to like video.' });
  }
});

// Dislike Video Toggle
router.post('/:id/dislike', requireAuth, (req: AuthRequest, res: Response): void => {
  try {
    const video = db.getVideoById(req.params.id);
    if (!video || !req.user) {
      res.status(404).json({ error: 'Video or user not found.' });
      return;
    }

    const userId = req.user._id;
    const isLiked = req.user.likedVideos.includes(video._id);
    const isDisliked = req.user.dislikedVideos.includes(video._id);

    let newLikes = video.likes;
    let newDislikes = video.dislikes;
    let updatedLikedVideos = [...req.user.likedVideos];
    let updatedDislikedVideos = [...req.user.dislikedVideos];

    if (isDisliked) {
      newDislikes = Math.max(0, newDislikes - 1);
      updatedDislikedVideos = updatedDislikedVideos.filter(id => id !== video._id);
    } else {
      newDislikes += 1;
      updatedDislikedVideos.push(video._id);
      if (isLiked) {
        newLikes = Math.max(0, newLikes - 1);
        updatedLikedVideos = updatedLikedVideos.filter(id => id !== video._id);
      }
    }

    const updatedVideo = db.updateVideo(video._id, { likes: newLikes, dislikes: newDislikes });
    db.updateUser(userId, { likedVideos: updatedLikedVideos, dislikedVideos: updatedDislikedVideos });

    res.json({ video: updatedVideo, likedVideos: updatedLikedVideos, dislikedVideos: updatedDislikedVideos });
  } catch (err) {
    res.status(500).json({ error: 'Failed to dislike video.' });
  }
});

const formatSecs = (sec: number): string => {
  if (!sec || isNaN(sec) || sec <= 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const sStr = s < 10 ? `0${s}` : `${s}`;
  if (h > 0) {
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${h}:${mStr}:${sStr}`;
  }
  return `${m}:${sStr}`;
};

// Upload Video (accepts POST / and POST /upload)
const handleUpload = (req: AuthRequest, res: Response): void => {
  try {
    let creatorUser = req.user;
    if (!creatorUser) {
      const allUsers = db.getUsers();
      creatorUser = allUsers.find(u => u.role === 'creator') || allUsers[0] || {
        _id: 'guest_creator_id',
        name: 'Guest Creator',
        username: 'guestcreator',
        email: 'creator@viewpoint.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
        subscribersCount: 1200,
        subscribedTo: [],
        likedVideos: [],
        dislikedVideos: [],
        savedPlaylists: [],
        verified: true,
        role: 'creator',
        createdAt: new Date().toISOString()
      };
    }

    const { title, description, videoUrl, thumbnailUrl, category, tags, isShort, visibility, duration, durationFormatted } = req.body;

    if (!title || !title.trim() || !videoUrl || !videoUrl.trim()) {
      res.status(400).json({ error: 'Title and Video URL or File are required.' });
      return;
    }

    const embed = getEmbedInfo(videoUrl);
    const finalThumb = (thumbnailUrl && thumbnailUrl.trim().length > 0)
      ? thumbnailUrl.trim()
      : (embed.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80');

    const durationNum = typeof duration === 'number' ? duration : parseInt(duration, 10);
    const validDuration = !isNaN(durationNum) && durationNum > 0 ? durationNum : (isShort ? 45 : 300);
    const finalDurationFormatted = durationFormatted || formatSecs(validDuration);

    const newVid = db.createVideo({
      title: title.trim(),
      description: description || `Published on ${new Date().toLocaleDateString()}`,
      videoUrl: videoUrl.trim(),
      thumbnailUrl: finalThumb,
      duration: validDuration,
      durationFormatted: finalDurationFormatted,
      creator: creatorUser,
      channelName: creatorUser.name,
      channelAvatar: creatorUser.avatar,
      channelId: creatorUser._id,
      verified: creatorUser.verified,
      category: (category as VideoCategory) || 'Technology',
      tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()) : ['Video']),
      isShort: Boolean(isShort),
      qualityOptions: ['1080p60', '720p', '480p'],
      visibility: visibility || 'public',
    });

    res.status(201).json(newVid);
  } catch (err: any) {
    console.error('Upload Video error:', err);
    res.status(500).json({ error: 'Failed to upload video: ' + (err?.message || 'Server error') });
  }
};

router.post('/', optionalAuth, handleUpload);
router.post('/upload', optionalAuth, handleUpload);

// Republish Video (bumps video to top of feed and syncs with Firestore)
router.post('/:id/republish', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const targetId = req.params.id;
    const republished = db.republishVideo(targetId);
    if (!republished) {
      res.status(404).json({ error: 'Video not found or could not be republished.' });
      return;
    }
    res.json({ message: 'Video republished successfully!', video: republished });
  } catch (err) {
    res.status(500).json({ error: 'Failed to republish video.' });
  }
});

// Delete All Videos
router.delete('/all', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const deletedCount = db.deleteAllVideos();
    res.json({ message: 'All videos deleted successfully.', deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete all videos.' });
  }
});

// Delete Video
router.delete('/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const targetId = req.params.id;
    const video = db.getVideoById(targetId);
    if (!video) {
      res.status(404).json({ error: 'Video not found or already deleted.' });
      return;
    }

    const deleted = db.deleteVideo(video._id);
    if (!deleted) {
      res.status(400).json({ error: 'Could not delete video from database.' });
      return;
    }

    res.json({ message: 'Video deleted successfully.', deletedId: video._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete video.' });
  }
});

export default router;
