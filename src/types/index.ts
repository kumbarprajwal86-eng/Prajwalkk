export type VideoCategory =
  | 'All'
  | 'Trending'
  | 'Gaming'
  | 'Music'
  | 'Sports'
  | 'News'
  | 'Education'
  | 'Fashion'
  | 'Technology'
  | 'Movies'
  | 'Shorts';

export interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  passwordHash?: string;
  avatar: string;
  banner?: string;
  bio?: string;
  subscribersCount: number;
  subscribedTo: string[]; // channel IDs
  likedVideos: string[];
  dislikedVideos: string[];
  savedPlaylists: string[];
  role: 'user' | 'creator' | 'admin';
  verified?: boolean;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    github?: string;
    website?: string;
    linkedin?: string;
  };
  location?: string;
  createdAt: string;
}

export interface VideoChapter {
  title: string;
  time: number; // in seconds
}

export interface Video {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // seconds
  durationFormatted: string; // e.g., "12:34"
  creator: User | string;
  channelName: string;
  channelAvatar: string;
  channelId: string;
  verified?: boolean;
  views: number;
  likes: number;
  dislikes: number;
  category: VideoCategory;
  tags: string[];
  isShort: boolean;
  isLive?: boolean;
  chapters?: VideoChapter[];
  qualityOptions?: string[]; // e.g. ["1080p", "720p", "480p", "360p"]
  visibility: 'public' | 'private' | 'unlisted';
  aiRecommendedReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  _id: string;
  videoId: string;
  user: {
    _id: string;
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  text: string;
  likes: number;
  dislikes: number;
  isPinned?: boolean;
  isCreatorHearted?: boolean;
  replies?: Comment[];
  createdAt: string;
}

export interface Playlist {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  creator: {
    _id: string;
    name: string;
    username: string;
    avatar: string;
  };
  videos: Video[];
  visibility: 'public' | 'private' | 'unlisted';
  views: number;
  updatedAt: string;
  createdAt: string;
}

export interface HistoryItem {
  _id: string;
  userId: string;
  video: Video;
  watchedAt: string;
  progressPercentage: number;
}

export interface Notification {
  _id: string;
  userId: string;
  sender?: {
    name: string;
    avatar: string;
  };
  type: 'upload' | 'reply' | 'mention' | 'like' | 'subscribe' | 'live';
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  _id: string;
  reporterId: string;
  reporterName: string;
  targetId: string; // videoId or commentId or userId
  targetType: 'video' | 'comment' | 'user';
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface AnalyticsData {
  totalViews: number;
  totalSubscribers: number;
  totalWatchTimeHours: number;
  estimatedRevenue: number;
  viewsHistory: { date: string; views: number }[];
  subscribersHistory: { date: string; subs: number }[];
  topVideos: { title: string; views: number; likes: number }[];
  audienceDemographics: { name: string; value: number }[];
}

export interface SearchFilters {
  query: string;
  category?: string;
  sortBy?: 'relevance' | 'date' | 'views' | 'likes';
  duration?: 'any' | 'short' | 'medium' | 'long';
  uploadDate?: 'any' | 'today' | 'week' | 'month' | 'year';
  type?: 'all' | 'video' | 'short' | 'live' | 'channel' | 'playlist';
}
