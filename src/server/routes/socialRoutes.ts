import { Router, Response } from 'express';
import { db } from '../db';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { SUPPORTED_PLATFORMS, SocialMediaService } from '../services/socialMediaService';

const router = Router();

// Get Supported Social Media Platforms & Sync Status
router.get('/platforms', (req, res: Response) => {
  try {
    const videos = db.getVideos();
    const updatedPlatforms = SUPPORTED_PLATFORMS.map(p => {
      const pLower = p.id.toLowerCase();
      const count = videos.filter(v =>
        v.channelName.toLowerCase().includes(pLower) ||
        (v.tags && v.tags.some(t => t.toLowerCase().includes(pLower)))
      ).length;
      return { ...p, syncedCount: count || p.syncedCount };
    });

    res.json({
      platforms: updatedPlatforms,
      totalSyncedVideos: videos.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch social media platforms.' });
  }
});

// Sync Social Media Videos into App Feed
router.post('/sync', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { platform, query } = req.body || {};
    const updatedVideos = db.syncSocialVideos(platform, query);
    res.json({
      message: `Successfully synced social media videos${platform ? ` from ${platform}` : ''}.`,
      totalVideos: updatedVideos.length,
      videos: updatedVideos
    });
  } catch (err) {
    console.error('Social sync error:', err);
    res.status(500).json({ error: 'Failed to sync videos from social media server.' });
  }
});

// Import Single Video from Social Media URL (YouTube, TikTok, Instagram, Pexels, Vimeo)
router.post('/import-url', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { url, title, category } = req.body || {};
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Valid social media video URL is required.' });
      return;
    }

    const importedVideo = db.importSocialVideoUrl(url, title, category);
    res.json({
      message: 'Video imported successfully from social media server!',
      video: importedVideo
    });
  } catch (err) {
    console.error('Import social video error:', err);
    res.status(500).json({ error: 'Failed to import video from social media URL.' });
  }
});

export default router;
