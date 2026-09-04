import mongoose from 'mongoose';
import { sampleUsers, sampleVideos, sampleComments, samplePlaylists, sampleNotifications, sampleAnalytics } from './seedData';
import { Video, User, Comment, Playlist, Notification, AnalyticsData, HistoryItem } from '../../types';
import { SocialMediaService } from '../services/socialMediaService';
import { firestoreSync } from './firebaseService';
import fs from 'fs';
import path from 'path';

function sanitizeMongoUri(rawUri?: string): string {
  if (!rawUri) return '';
  let uri = rawUri.trim();
  
  // If there are multiple @ symbols remaining (e.g. unencoded @ in username or password like user:p@ss@cluster)
  // The last @ separates credentials from the host list. Any preceding @ symbols belong to user:pass and must be percent-encoded (%40).
  const protocolMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)(.*)$/i);
  if (protocolMatch) {
    const protocol = protocolMatch[1];
    const rest = protocolMatch[2];
    
    // Find the first '/' or '?' which marks the end of authority section (hosts and credentials)
    const authEndIdx = rest.search(/[\/\?]/);
    const authority = authEndIdx === -1 ? rest : rest.slice(0, authEndIdx);
    const suffix = authEndIdx === -1 ? '' : rest.slice(authEndIdx);
    
    // In authority section, if there is more than one '@' symbol, encode all except the last one
    const atCount = (authority.match(/@/g) || []).length;
    if (atCount > 1) {
      const lastAtIdx = authority.lastIndexOf('@');
      const creds = authority.slice(0, lastAtIdx).replace(/@/g, '%40');
      const hostPart = authority.slice(lastAtIdx);
      return protocol + creds + hostPart + suffix;
    }
  }
  return uri;
}

class DatabaseManager {
  private isMongoConnected: boolean = false;
  private users: User[] = [...sampleUsers];
  private videos: Video[] = [];
  private comments: Comment[] = [...sampleComments];
  private playlists: Playlist[] = [...samplePlaylists];
  private notifications: Notification[] = [...sampleNotifications];
  private history: HistoryItem[] = [];
  private analytics: AnalyticsData = { ...sampleAnalytics };
  private dbFilePath = (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)
    ? path.join('/tmp', '.viewpoint-local-db.json')
    : path.join(process.cwd(), '.viewpoint-local-db.json');

  constructor() {
    this.loadLocalDb();
    this.syncFirestoreOnStartup();
  }

  private async syncFirestoreOnStartup() {
    if (!firestoreSync.isAvailable()) return;
    try {
      console.log('[Firebase] Synchronizing database collections from Firestore...');
      const fsUsers = await firestoreSync.loadCollection<User>('users');
      const fsVideos = await firestoreSync.loadCollection<Video>('videos');
      const fsComments = await firestoreSync.loadCollection<Comment>('comments');
      const fsPlaylists = await firestoreSync.loadCollection<Playlist>('playlists');
      const fsNotifications = await firestoreSync.loadCollection<Notification>('notifications');

      if (fsUsers.length > 0) this.users = fsUsers;
      else {
        // Seed Firestore with initial sample users
        sampleUsers.forEach(u => firestoreSync.saveDoc('users', u));
      }

      if (fsVideos.length > 0) {
        this.videos = fsVideos;
      } else if (this.videos.length > 0) {
        // If local has videos, persist them to Firestore
        this.videos.forEach(v => firestoreSync.saveDoc('videos', v));
      }

      if (fsComments.length > 0) this.comments = fsComments;
      if (fsPlaylists.length > 0) this.playlists = fsPlaylists;
      if (fsNotifications.length > 0) this.notifications = fsNotifications;

      console.log(`[Firebase] Firestore database sync complete. ${this.videos.length} videos, ${this.users.length} users active.`);
      this.saveLocalDb();
    } catch (err: any) {
      console.warn('[Firebase] Firestore startup sync warning:', err?.message || err);
    }
  }

  private loadLocalDb() {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.dbFilePath, 'utf-8'));
        if (data.users && Array.isArray(data.users)) {
          this.users = data.users.filter((u: User) => u && u._id);
        }
        if (data.videos && Array.isArray(data.videos)) {
          this.videos = data.videos.filter((v: Video) => v && v._id).map((v: Video) => ({
            ...v,
            views: typeof v.views === 'number' ? v.views : 0,
            likes: typeof v.likes === 'number' ? v.likes : 0,
            dislikes: typeof v.dislikes === 'number' ? v.dislikes : 0,
          }));
        }
        if (data.comments && Array.isArray(data.comments)) {
          this.comments = data.comments.filter((c: Comment) => c && c._id);
        }
        if (data.playlists && Array.isArray(data.playlists)) {
          this.playlists = data.playlists.filter((p: Playlist) => p && p._id);
        }
        if (data.notifications && Array.isArray(data.notifications)) {
          this.notifications = data.notifications.filter((n: Notification) => n && n._id);
        }
        if (data.history && Array.isArray(data.history)) {
          this.history = data.history.filter((h: HistoryItem) => h && h._id);
        }
        console.log(`[DB] Loaded local storage with ${this.videos.length} videos and ${this.users.length} users.`);
      } else {
        this.users = [...sampleUsers];
        this.videos = [...sampleVideos];
        this.comments = [...sampleComments];
        this.playlists = [...samplePlaylists];
        this.notifications = [...sampleNotifications];
        this.history = [];
      }
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[DB] Could not load local DB file: ${errMsg}`);
    }
    this.saveLocalDb();
  }

  private saveLocalDb() {
    try {
      fs.writeFileSync(this.dbFilePath, JSON.stringify({
        users: this.users,
        videos: this.videos,
        comments: this.comments,
        playlists: this.playlists,
        notifications: this.notifications,
        history: this.history,
      }, null, 2));
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[DB] Failed to save local DB file: ${errMsg}`);
    }
  }

  async connect(): Promise<void> {
    const rawUri = process.env.MONGODB_URI;
    const uri = sanitizeMongoUri(rawUri);
    if (uri && !uri.includes('user:password') && !uri.includes('cluster0.mongodb.net/viewpoint') && !uri.includes('cluster0.mongodb.net/streamtube')) {
      try {
        console.log('[MongoDB] Attempting connection to MongoDB Atlas...');
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
        this.isMongoConnected = true;
        console.log('[MongoDB] Connected successfully to MongoDB Atlas!');
        return;
      } catch (err: any) {
        const errMsg = err instanceof Error ? err.message : String(err);
        let hint = '';
        if (errMsg.includes('whitelist') || errMsg.includes('Could not connect to any servers') || errMsg.includes('timeout') || errMsg.includes('ENOTFOUND')) {
          hint = ' -> [IMPORTANT HINT] Please check your MongoDB Atlas Network Access settings and add "0.0.0.0/0" (Allow Access from Anywhere) so cloud preview containers can connect.';
        }
        console.warn(`[MongoDB] Connection failed (${errMsg})${hint}. Falling back to high-performance local JSON engine.`);
        this.isMongoConnected = false;
      }
    } else {
      console.log('[DB] Using Firestore Cloud Database & local persistent storage engine (Instant preview mode).');
    }
  }

  isMongo(): boolean {
    return this.isMongoConnected;
  }

  // --- Users ---
  getUsers(): User[] {
    return this.users;
  }
  getUserById(id: string): User | undefined {
    return this.users.find(u => u._id === id || u.username === id);
  }
  getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  getUserByEmailOrUsername(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.users.find(u => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean);
  }
  createUser(user: Omit<User, '_id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      _id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.saveLocalDb();
    firestoreSync.saveDoc('users', newUser);
    return newUser;
  }
  updateUser(id: string, updates: Partial<User>): User | undefined {
    const idx = this.users.findIndex(u => u._id === id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...updates };
      this.saveLocalDb();
      firestoreSync.saveDoc('users', this.users[idx]);
      return this.users[idx];
    }
    return undefined;
  }

  deleteUser(id: string): boolean {
    const targetId = String(id);
    const idx = this.users.findIndex(u => String(u._id) === targetId);
    if (idx === -1) return false;

    // Remove user
    this.users.splice(idx, 1);
    firestoreSync.deleteDoc('users', targetId);

    // Delete all videos uploaded by user
    const userVideos = this.videos.filter(v => {
      const creatorId = typeof v.creator === 'object' && v.creator ? v.creator._id : v.creator;
      return String(creatorId) === targetId || String(v.channelId) === targetId;
    });
    userVideos.forEach(v => this.deleteVideo(v._id));

    // Remove user comments
    this.comments = this.comments.filter(c => String(c.user._id) !== targetId);

    // Delete playlists created by user
    this.playlists = this.playlists.filter(p => String(p.creator._id) !== targetId);

    // Clear history for user
    this.history = this.history.filter(h => String(h.userId) !== targetId);

    // Clean up subscriptions
    this.users.forEach(u => {
      if (Array.isArray(u.subscribedTo)) {
        u.subscribedTo = u.subscribedTo.filter(subId => String(subId) !== targetId);
      }
    });

    this.saveLocalDb();
    return true;
  }

  // --- Videos ---
  getVideos(): Video[] {
    return this.videos;
  }
  getVideoById(id: string): Video | undefined {
    const rawId = String(id || '').trim();
    const cleanId = rawId.includes('-more-') ? rawId.split('-more-')[0] : rawId;
    return this.videos.find(v => String(v._id) === cleanId || String(v._id) === rawId);
  }
  createVideo(video: Omit<Video, '_id' | 'createdAt' | 'views' | 'likes' | 'dislikes'>): Video {
    const newVid: Video = {
      ...video,
      _id: `vid-${Date.now()}`,
      views: 0,
      likes: 0,
      dislikes: 0,
      createdAt: new Date().toISOString(),
    };
    this.videos.unshift(newVid);
    this.saveLocalDb();
    firestoreSync.saveDoc('videos', newVid);
    return newVid;
  }
  updateVideo(id: string, updates: Partial<Video>): Video | undefined {
    const idx = this.videos.findIndex(v => v._id === id);
    if (idx !== -1) {
      this.videos[idx] = { ...this.videos[idx], ...updates, updatedAt: new Date().toISOString() };
      this.saveLocalDb();
      firestoreSync.saveDoc('videos', this.videos[idx]);
      return this.videos[idx];
    }
    return undefined;
  }
  republishVideo(id: string): Video | undefined {
    const rawId = String(id || '').trim();
    const cleanId = rawId.includes('-more-') ? rawId.split('-more-')[0] : rawId;
    const idx = this.videos.findIndex(v => String(v._id) === cleanId || String(v._id) === rawId);
    if (idx !== -1) {
      const vid = this.videos[idx];
      this.videos.splice(idx, 1);
      const updatedVid: Video = {
        ...vid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.videos.unshift(updatedVid);
      this.saveLocalDb();
      firestoreSync.saveDoc('videos', updatedVid);
      return updatedVid;
    }
    return undefined;
  }
  deleteVideo(id: string): boolean {
    const rawId = String(id || '').trim();
    const cleanId = rawId.includes('-more-') ? rawId.split('-more-')[0] : rawId;
    const idx = this.videos.findIndex(v => String(v._id) === cleanId || String(v._id) === rawId);
    if (idx !== -1) {
      const deletedVideo = this.videos[idx];
      const targetId = String(deletedVideo._id);
      this.videos.splice(idx, 1);
      firestoreSync.deleteDoc('videos', targetId);

      // Clean up comments for deleted video
      this.comments = this.comments.filter(c => String(c.videoId) !== targetId);

      // Clean up history items
      this.history = this.history.filter(h => h.video && String(h.video._id) !== targetId);

      // Clean up playlists
      this.playlists.forEach(p => {
        if (Array.isArray(p.videos)) {
          p.videos = p.videos.filter(v => v && String(v._id) !== targetId);
        }
      });

      // Clean up liked/disliked videos in users
      this.users.forEach(u => {
        if (Array.isArray(u.likedVideos)) {
          u.likedVideos = u.likedVideos.filter(vId => String(vId) !== targetId);
        }
        if (Array.isArray(u.dislikedVideos)) {
          u.dislikedVideos = u.dislikedVideos.filter(vId => String(vId) !== targetId);
        }
      });

      this.saveLocalDb();
      return true;
    }
    return false;
  }

  deleteAllVideos(): number {
    const count = this.videos.length;
    this.videos.forEach(v => firestoreSync.deleteDoc('videos', v._id));
    this.videos = [];
    this.comments = [];
    this.history = [];
    this.playlists.forEach(p => {
      p.videos = [];
    });
    this.users.forEach(u => {
      u.likedVideos = [];
      u.dislikedVideos = [];
    });
    this.saveLocalDb();
    return count;
  }

  syncSocialVideos(platform?: string, query?: string): Video[] {
    const socialItems = SocialMediaService.getSocialVideosForSync(platform, query);
    const existingIds = new Set(this.videos.map(v => v._id));
    
    for (const item of socialItems) {
      if (!existingIds.has(item._id)) {
        this.videos.unshift(item);
        existingIds.add(item._id);
        firestoreSync.saveDoc('videos', item);
      }
    }
    
    this.saveLocalDb();
    return this.videos;
  }

  importSocialVideoUrl(url: string, title?: string, category?: any): Video {
    const newVideo = SocialMediaService.parseSocialVideoUrl(url, title, category);
    this.videos.unshift(newVideo);
    this.saveLocalDb();
    firestoreSync.saveDoc('videos', newVideo);
    return newVideo;
  }

  // --- Comments ---
  getCommentsByVideoId(videoId: string): Comment[] {
    return this.comments.filter(c => c.videoId === videoId);
  }
  createComment(comment: Omit<Comment, '_id' | 'createdAt' | 'likes' | 'dislikes'>): Comment {
    const newComm: Comment = {
      ...comment,
      _id: `comm-${Date.now()}`,
      likes: 0,
      dislikes: 0,
      createdAt: new Date().toISOString(),
    };
    this.comments.unshift(newComm);
    this.saveLocalDb();
    firestoreSync.saveDoc('comments', newComm);
    return newComm;
  }
  likeComment(id: string): Comment | undefined {
    const c = this.comments.find(cm => cm._id === id);
    if (c) {
      c.likes += 1;
      this.saveLocalDb();
      firestoreSync.saveDoc('comments', c);
      return c;
    }
    return undefined;
  }
  deleteComment(id: string): boolean {
    const idx = this.comments.findIndex(c => c._id === id);
    if (idx !== -1) {
      const deletedId = this.comments[idx]._id;
      this.comments.splice(idx, 1);
      this.saveLocalDb();
      firestoreSync.deleteDoc('comments', deletedId);
      return true;
    }
    return false;
  }

  // --- Playlists ---
  getPlaylists(userId?: string): Playlist[] {
    if (userId) {
      return this.playlists.filter(p => p.creator._id === userId || p.visibility === 'public');
    }
    return this.playlists.filter(p => p.visibility === 'public');
  }
  getPlaylistById(id: string): Playlist | undefined {
    return this.playlists.find(p => p._id === id);
  }
  createPlaylist(pl: Omit<Playlist, '_id' | 'createdAt' | 'updatedAt' | 'views'>): Playlist {
    const newPl: Playlist = {
      ...pl,
      _id: `play-${Date.now()}`,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.playlists.unshift(newPl);
    this.saveLocalDb();
    firestoreSync.saveDoc('playlists', newPl);
    return newPl;
  }
  updatePlaylist(id: string, updates: Partial<Playlist>): Playlist | undefined {
    const idx = this.playlists.findIndex(p => p._id === id);
    if (idx !== -1) {
      this.playlists[idx] = { ...this.playlists[idx], ...updates, updatedAt: new Date().toISOString() };
      this.saveLocalDb();
      firestoreSync.saveDoc('playlists', this.playlists[idx]);
      return this.playlists[idx];
    }
    return undefined;
  }
  deletePlaylist(id: string): boolean {
    const idx = this.playlists.findIndex(p => p._id === id);
    if (idx !== -1) {
      const deletedId = this.playlists[idx]._id;
      this.playlists.splice(idx, 1);
      this.saveLocalDb();
      firestoreSync.deleteDoc('playlists', deletedId);
      return true;
    }
    return false;
  }

  // --- History ---
  getHistory(userId: string): HistoryItem[] {
    return this.history.filter(h => h.userId === userId);
  }
  addToHistory(userId: string, video: Video, progress: number): HistoryItem {
    const existingIdx = this.history.findIndex(h => h.userId === userId && h.video._id === video._id);
    if (existingIdx !== -1) {
      this.history[existingIdx].watchedAt = new Date().toISOString();
      this.history[existingIdx].progressPercentage = progress;
      this.saveLocalDb();
      firestoreSync.saveDoc('history', this.history[existingIdx]);
      return this.history[existingIdx];
    }
    const item: HistoryItem = {
      _id: `hist-${Date.now()}`,
      userId,
      video,
      watchedAt: new Date().toISOString(),
      progressPercentage: progress,
    };
    this.history.unshift(item);
    this.saveLocalDb();
    firestoreSync.saveDoc('history', item);
    return item;
  }
  clearHistory(userId: string): void {
    const userItems = this.history.filter(h => h.userId === userId);
    userItems.forEach(i => firestoreSync.deleteDoc('history', i._id));
    this.history = this.history.filter(h => h.userId !== userId);
    this.saveLocalDb();
  }
  removeFromHistory(userId: string, videoId: string): void {
    const targetVidId = String(videoId);
    const toRemove = this.history.filter(h => String(h.userId) === String(userId) && h.video && String(h.video._id) === targetVidId);
    toRemove.forEach(i => firestoreSync.deleteDoc('history', i._id));
    this.history = this.history.filter(h => !(String(h.userId) === String(userId) && h.video && String(h.video._id) === targetVidId));
    this.saveLocalDb();
  }

  // --- Notifications ---
  getNotifications(userId: string): Notification[] {
    return this.notifications.filter(n => n.userId === userId);
  }
  markNotificationRead(id: string): void {
    const n = this.notifications.find(nt => nt._id === id);
    if (n) {
      n.isRead = true;
      this.saveLocalDb();
      firestoreSync.saveDoc('notifications', n);
    }
  }

  // --- Analytics ---
  getAnalytics(): AnalyticsData {
    return this.analytics;
  }
}

export const db = new DatabaseManager();

