import { Video, VideoCategory } from '../../types';

export interface SocialPlatform {
  id: 'youtube' | 'tiktok' | 'instagram' | 'pexels' | 'vimeo';
  name: string;
  icon: string;
  connected: boolean;
  color: string;
  description: string;
  syncedCount: number;
}

export const SUPPORTED_PLATFORMS: SocialPlatform[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'Youtube',
    connected: true,
    color: '#FF0000',
    description: 'Sync long-form videos, tech reviews, gaming & music',
    syncedCount: 0,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'Music2',
    connected: true,
    color: '#00F2FE',
    description: 'Sync vertical short videos and reels',
    syncedCount: 0,
  },
  {
    id: 'instagram',
    name: 'Instagram Reels',
    icon: 'Instagram',
    connected: true,
    color: '#E1306C',
    description: 'Sync travel, fashion, lifestyle & aesthetic reels',
    syncedCount: 0,
  },
  {
    id: 'pexels',
    name: 'Pexels Video Server',
    icon: 'Video',
    connected: true,
    color: '#05A081',
    description: 'Sync 4K nature, technology & royalty-free clips',
    syncedCount: 0,
  },
  {
    id: 'vimeo',
    name: 'Vimeo Staff Picks',
    icon: 'Film',
    connected: true,
    color: '#1AB7EA',
    description: 'Sync short films, animation & creative showcases',
    syncedCount: 0,
  }
];

export const INITIAL_SOCIAL_VIDEOS: Video[] = [];

export class SocialMediaService {
  /**
   * Sync social media videos into the target database array or return fresh feed items
   */
  public static getSocialVideosForSync(platform?: string, query?: string): Video[] {
    let list = [...INITIAL_SOCIAL_VIDEOS];

    if (platform && platform !== 'all') {
      const platLower = platform.toLowerCase();
      list = list.filter(v => 
        v.channelName.toLowerCase().includes(platLower) ||
        v.tags.some(t => t.toLowerCase().includes(platLower))
      );
    }

    if (query) {
      const qLower = query.toLowerCase();
      list = list.filter(v =>
        v.title.toLowerCase().includes(qLower) ||
        v.description.toLowerCase().includes(qLower) ||
        v.tags.some(t => t.toLowerCase().includes(qLower))
      );
    }

    return list;
  }

  /**
   * Parse direct video URL from YouTube, TikTok, Instagram, Vimeo, Pexels or generic MP4
   */
  public static parseSocialVideoUrl(url: string, customTitle?: string, category: VideoCategory = 'Trending'): Video {
    const cleanUrl = url.trim();
    let isShort = false;
    let title = customTitle || 'Social Media Synced Video';
    let channelName = 'Social Media Creator';
    let thumbnailUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
    let videoUrl = cleanUrl;

    if (cleanUrl.includes('youtube.com/shorts') || cleanUrl.includes('tiktok.com') || cleanUrl.includes('instagram.com/reel')) {
      isShort = true;
    }

    if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
      channelName = 'YouTube Creator';
      if (!customTitle) title = 'YouTube Imported Stream';
      let ytId = '';
      if (cleanUrl.includes('watch?v=')) {
        ytId = cleanUrl.split('watch?v=')[1]?.split('&')[0]?.split('#')[0] || '';
      } else if (cleanUrl.includes('youtu.be/')) {
        ytId = cleanUrl.split('youtu.be/')[1]?.split('?')[0]?.split('#')[0] || '';
      } else if (cleanUrl.includes('youtube.com/shorts/')) {
        ytId = cleanUrl.split('youtube.com/shorts/')[1]?.split('?')[0]?.split('#')[0] || '';
      } else if (cleanUrl.includes('youtube.com/embed/')) {
        ytId = cleanUrl.split('youtube.com/embed/')[1]?.split('?')[0]?.split('#')[0] || '';
      }
      if (ytId) {
        videoUrl = `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1&rel=0`;
        thumbnailUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      } else {
        thumbnailUrl = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80';
      }
    } else if (cleanUrl.includes('vimeo.com')) {
      channelName = 'Vimeo Creator';
      if (!customTitle) title = 'Vimeo Video Stream';
      thumbnailUrl = 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80';
      let vimeoId = '';
      if (cleanUrl.includes('player.vimeo.com/video/')) {
        vimeoId = cleanUrl.split('player.vimeo.com/video/')[1]?.split('?')[0] || '';
      } else {
        const parts = cleanUrl.split('/');
        vimeoId = parts[parts.length - 1]?.split('?')[0] || '';
      }
      if (vimeoId && /^\d+$/.test(vimeoId)) {
        videoUrl = `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
      }
    } else if (cleanUrl.includes('tiktok.com')) {
      channelName = 'TikTok Reel Sync';
      if (!customTitle) title = 'TikTok Viral Short';
      thumbnailUrl = 'https://images.unsplash.com/photo-1596558450255-7c0b7be9d56a?w=800&auto=format&fit=crop&q=80';
      let ttId = '';
      if (cleanUrl.includes('/video/')) {
        ttId = cleanUrl.split('/video/')[1]?.split('?')[0]?.split('/')[0] || '';
      }
      if (ttId) {
        videoUrl = `https://www.tiktok.com/embed/v2/${ttId}`;
      }
    } else if (cleanUrl.includes('instagram.com')) {
      channelName = 'Instagram Creator';
      if (!customTitle) title = 'Instagram Reel Story';
      thumbnailUrl = 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=800&auto=format&fit=crop&q=80';
      let igId = '';
      if (cleanUrl.includes('/reel/')) {
        igId = cleanUrl.split('/reel/')[1]?.split('/')[0]?.split('?')[0] || '';
      } else if (cleanUrl.includes('/p/')) {
        igId = cleanUrl.split('/p/')[1]?.split('/')[0]?.split('?')[0] || '';
      }
      if (igId) {
        videoUrl = `https://www.instagram.com/p/${igId}/embed`;
      }
    } else if (cleanUrl.includes('pexels.com')) {
      channelName = 'Pexels HD Video';
      if (!customTitle) title = 'Pexels Cinematic Video';
      thumbnailUrl = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80';
    }

    return {
      _id: `social-import-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      description: `Synced from social media server (${cleanUrl}). High definition content synced automatically.`,
      videoUrl,
      thumbnailUrl,
      duration: isShort ? 30 : 240,
      durationFormatted: isShort ? '0:30' : '04:00',
      creator: 'user-admin',
      channelName,
      channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      channelId: 'ch-social-import',
      verified: true,
      views: Math.floor(Math.random() * 50000) + 1200,
      likes: Math.floor(Math.random() * 5000) + 150,
      dislikes: 5,
      category: isShort ? 'Shorts' : category,
      tags: ['SocialSync', 'Imported', channelName],
      isShort,
      qualityOptions: ['1080p', '720p'],
      visibility: 'public',
      aiRecommendedReason: 'Synced directly from external social media server',
      createdAt: new Date().toISOString()
    };
  }
}
