import { User, Video } from '../types';

export const RELIABLE_VIDEO_URLS = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://media.w3.org/2010/05/bunny/trailer.mp4',
  'https://www.w3schools.com/tags/movie.mp4',
  'https://media.w3.org/2010/05/video/movie_300.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
  'https://media.w3.org/2010/05/bunny/movie.mp4',
  'https://www.w3schools.com/html/movie.mp4'
];

export interface EmbedInfo {
  isEmbed: boolean;
  embedUrl: string;
  originalUrl: string;
  type: 'youtube' | 'vimeo' | 'tiktok' | 'instagram' | 'direct' | 'iframe';
  videoId?: string;
  thumbnailUrl?: string;
}

/**
 * Parses any video URL (YouTube, Vimeo, TikTok, Instagram, Pexels, direct MP4)
 * and returns structured embed information for seamless playback.
 */
export const getEmbedInfo = (url?: string): EmbedInfo => {
  if (!url || typeof url !== 'string') {
    return {
      isEmbed: false,
      embedUrl: RELIABLE_VIDEO_URLS[0],
      originalUrl: '',
      type: 'direct'
    };
  }

  const cleanUrl = url.trim();

  // 1. YouTube URLs
  if (
    cleanUrl.includes('youtube.com') ||
    cleanUrl.includes('youtu.be') ||
    cleanUrl.includes('youtube-nocookie.com')
  ) {
    let videoId = '';
    if (cleanUrl.includes('watch?v=')) {
      videoId = cleanUrl.split('watch?v=')[1]?.split('&')[0]?.split('#')[0] || '';
    } else if (cleanUrl.includes('youtu.be/')) {
      videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0]?.split('#')[0] || '';
    } else if (cleanUrl.includes('youtube.com/shorts/')) {
      videoId = cleanUrl.split('youtube.com/shorts/')[1]?.split('?')[0]?.split('#')[0] || '';
    } else if (cleanUrl.includes('youtube.com/embed/')) {
      videoId = cleanUrl.split('youtube.com/embed/')[1]?.split('?')[0]?.split('#')[0] || '';
    }

    if (videoId) {
      return {
        isEmbed: true,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0`,
        originalUrl: cleanUrl,
        type: 'youtube',
        videoId,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      };
    }
  }

  // 2. Vimeo URLs
  if (cleanUrl.includes('vimeo.com')) {
    let videoId = '';
    if (cleanUrl.includes('player.vimeo.com/video/')) {
      videoId = cleanUrl.split('player.vimeo.com/video/')[1]?.split('?')[0]?.split('#')[0] || '';
    } else {
      const match = cleanUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/);
      if (match && match[3]) {
        videoId = match[3];
      } else {
        const parts = cleanUrl.split('/');
        videoId = parts[parts.length - 1]?.split('?')[0] || '';
      }
    }

    if (videoId && /^\d+$/.test(videoId)) {
      return {
        isEmbed: true,
        embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
        originalUrl: cleanUrl,
        type: 'vimeo',
        videoId
      };
    }
  }

  // 3. TikTok URLs
  if (cleanUrl.includes('tiktok.com')) {
    let videoId = '';
    if (cleanUrl.includes('/video/')) {
      videoId = cleanUrl.split('/video/')[1]?.split('?')[0]?.split('/')[0] || '';
    } else if (cleanUrl.includes('/embed/v2/')) {
      videoId = cleanUrl.split('/embed/v2/')[1]?.split('?')[0] || '';
    }

    if (videoId) {
      return {
        isEmbed: true,
        embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
        originalUrl: cleanUrl,
        type: 'tiktok',
        videoId
      };
    }
  }

  // 4. Instagram Reels / Posts
  if (cleanUrl.includes('instagram.com')) {
    let videoId = '';
    if (cleanUrl.includes('/reel/')) {
      videoId = cleanUrl.split('/reel/')[1]?.split('/')[0]?.split('?')[0] || '';
    } else if (cleanUrl.includes('/p/')) {
      videoId = cleanUrl.split('/p/')[1]?.split('/')[0]?.split('?')[0] || '';
    }

    if (videoId) {
      return {
        isEmbed: true,
        embedUrl: `https://www.instagram.com/p/${videoId}/embed`,
        originalUrl: cleanUrl,
        type: 'instagram',
        videoId
      };
    }
  }

  // 5. Google Drive URLs
  if (cleanUrl.includes('drive.google.com')) {
    let driveId = '';
    if (cleanUrl.includes('/file/d/')) {
      driveId = cleanUrl.split('/file/d/')[1]?.split('/')[0]?.split('?')[0] || '';
    } else if (cleanUrl.includes('id=')) {
      driveId = cleanUrl.split('id=')[1]?.split('&')[0] || '';
    }
    if (driveId) {
      return {
        isEmbed: true,
        embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
        originalUrl: cleanUrl,
        type: 'iframe',
        videoId: driveId
      };
    }
  }

  // 6. Loom URLs
  if (cleanUrl.includes('loom.com')) {
    let loomId = '';
    if (cleanUrl.includes('/share/')) {
      loomId = cleanUrl.split('/share/')[1]?.split('?')[0] || '';
    } else if (cleanUrl.includes('/embed/')) {
      loomId = cleanUrl.split('/embed/')[1]?.split('?')[0] || '';
    }
    if (loomId) {
      return {
        isEmbed: true,
        embedUrl: `https://www.loom.com/embed/${loomId}`,
        originalUrl: cleanUrl,
        type: 'iframe',
        videoId: loomId
      };
    }
  }

  // 7. Streamable URLs
  if (cleanUrl.includes('streamable.com')) {
    const parts = cleanUrl.split('/');
    const streamableId = parts[parts.length - 1]?.split('?')[0] || '';
    if (streamableId) {
      return {
        isEmbed: true,
        embedUrl: `https://streamable.com/e/${streamableId}`,
        originalUrl: cleanUrl,
        type: 'iframe',
        videoId: streamableId
      };
    }
  }

  // 8. Dailymotion
  if (cleanUrl.includes('dailymotion.com')) {
    let dmId = '';
    if (cleanUrl.includes('/video/')) {
      dmId = cleanUrl.split('/video/')[1]?.split('?')[0] || '';
    }
    if (dmId) {
      return {
        isEmbed: true,
        embedUrl: `https://www.dailymotion.com/embed/video/${dmId}`,
        originalUrl: cleanUrl,
        type: 'iframe',
        videoId: dmId
      };
    }
  }

  // 9. Twitch
  if (cleanUrl.includes('twitch.tv')) {
    return {
      isEmbed: true,
      embedUrl: cleanUrl.includes('player.twitch.tv') ? cleanUrl : `https://player.twitch.tv/?channel=${cleanUrl.split('twitch.tv/')[1]?.split('/')[0]}&parent=localhost`,
      originalUrl: cleanUrl,
      type: 'iframe'
    };
  }

  // 10. Explicit iframe or embed URLs
  if (cleanUrl.includes('/embed/') || cleanUrl.includes('player.') || cleanUrl.includes('preview')) {
    return {
      isEmbed: true,
      embedUrl: cleanUrl,
      originalUrl: cleanUrl,
      type: 'iframe'
    };
  }

  // 6. Direct Video Files (.mp4, .webm, .mov, blob:, data:, etc.)
  const workingUrl = getWorkingVideoUrl(cleanUrl);
  return {
    isEmbed: false,
    embedUrl: workingUrl,
    originalUrl: cleanUrl,
    type: 'direct'
  };
};

/**
 * Replaces known broken storage URLs (like commondatastorage.googleapis.com which returns 403)
 * with a reliable working public video URL.
 */
export const getWorkingVideoUrl = (url?: string): string => {
  if (!url) return RELIABLE_VIDEO_URLS[0];

  if (url.includes('commondatastorage.googleapis.com') || url.includes('gtv-videos-bucket')) {
    if (url.includes('BigBuckBunny')) return RELIABLE_VIDEO_URLS[0];
    if (url.includes('TearsOfSteel')) return RELIABLE_VIDEO_URLS[1];
    if (url.includes('ElephantsDream')) return RELIABLE_VIDEO_URLS[2];
    if (url.includes('Sintel')) return RELIABLE_VIDEO_URLS[1];
    if (url.includes('ForBiggerBlazes')) return RELIABLE_VIDEO_URLS[3];
    if (url.includes('ForBiggerEscapes')) return RELIABLE_VIDEO_URLS[4];
    if (url.includes('ForBiggerFun')) return RELIABLE_VIDEO_URLS[5];
    if (url.includes('ForBiggerJoy')) return RELIABLE_VIDEO_URLS[6];
    if (url.includes('ForBiggerMeltdowns')) return RELIABLE_VIDEO_URLS[7];
    
    let hash = 0;
    for (let i = 0; i < url.length; i++) hash = (hash << 5) - hash + url.charCodeAt(i);
    return RELIABLE_VIDEO_URLS[Math.abs(hash) % RELIABLE_VIDEO_URLS.length];
  }
  return url;
};

/**
 * Returns the next fallback video URL if the current one throws a playback or media load error.
 */
export const getFallbackVideoUrl = (currentUrl?: string, attemptIndex = 0): string => {
  if (attemptIndex < RELIABLE_VIDEO_URLS.length) {
    const candidate = RELIABLE_VIDEO_URLS[attemptIndex];
    if (candidate === currentUrl && attemptIndex + 1 < RELIABLE_VIDEO_URLS.length) {
      return RELIABLE_VIDEO_URLS[attemptIndex + 1];
    }
    return candidate;
  }
  return RELIABLE_VIDEO_URLS[0];
};

/**
 * Formats duration in seconds to standard HH:MM:SS or MM:SS format.
 * If seconds are invalid or zero, returns provided fallback or '0:00'.
 */
export const formatVideoDuration = (durationInSeconds?: number | string, fallbackFormatted?: string): string => {
  if (durationInSeconds !== undefined && durationInSeconds !== null) {
    const totalSeconds = typeof durationInSeconds === 'number'
      ? Math.floor(durationInSeconds)
      : parseInt(String(durationInSeconds), 10);

    if (!isNaN(totalSeconds) && totalSeconds > 0) {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);

      const paddedSeconds = seconds.toString().padStart(2, '0');

      if (hours > 0) {
        const paddedMinutes = minutes.toString().padStart(2, '0');
        return `${hours}:${paddedMinutes}:${paddedSeconds}`;
      }

      return `${minutes}:${paddedSeconds}`;
    }
  }

  if (fallbackFormatted && typeof fallbackFormatted === 'string' && fallbackFormatted.trim().length > 0) {
    return fallbackFormatted;
  }

  return '0:00';
};

/**
 * Checks if a given user is allowed to manage/delete a video.
 * Always returns true so users can delete uploaded files/videos anytime.
 */
export const isUserVideoUploader = (user: User | null | undefined, video: Video): boolean => {
  if (!video) return false;
  return true;
};

/**
 * Connects to the backend download API and triggers a direct browser download to the user's file manager.
 */
export const downloadVideoFile = async (
  video: { _id: string; title: string; videoUrl: string },
  onProgress?: (progress: number) => void
): Promise<boolean> => {
  const cleanTitle = (video.title || 'video')
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'video';
  const filename = `${cleanTitle}.mp4`;
  const baseId = video._id.split('-more-')[0];

  if (onProgress) onProgress(15);

  try {
    // 1. Fetch video file from backend download endpoint
    const response = await fetch(`/api/videos/${baseId}/download`);
    if (onProgress) onProgress(50);

    if (response.ok) {
      const blob = await response.blob();
      if (onProgress) onProgress(85);

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      if (onProgress) onProgress(100);
      return true;
    }
  } catch (err) {
    console.warn('Backend download endpoint fetch failed, falling back to direct videoUrl download', err);
  }

  // 2. Direct fallback download from video.videoUrl
  try {
    if (onProgress) onProgress(60);
    const targetUrl = video.videoUrl;

    if (targetUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (onProgress) onProgress(100);
      return true;
    }

    const res = await fetch(targetUrl);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

    if (onProgress) onProgress(100);
    return true;
  } catch (fallbackErr) {
    console.error('Fallback video download failed:', fallbackErr);
    const a = document.createElement('a');
    a.href = video.videoUrl;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (onProgress) onProgress(100);
    return true;
  }
};


