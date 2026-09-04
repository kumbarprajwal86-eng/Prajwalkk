import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { db } from './db';

// Routes
import authRoutes from './routes/authRoutes';
import videoRoutes from './routes/videoRoutes';
import userRoutes from './routes/userRoutes';
import commentRoutes from './routes/commentRoutes';
import playlistRoutes from './routes/playlistRoutes';
import historyRoutes from './routes/historyRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';
import geminiRoutes from './routes/geminiRoutes';
import socialRoutes from './routes/socialRoutes';

export function createApiApp() {
  const app = express();

  // Middleware
  app.use(cors({ credentials: true, origin: true }));
  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ extended: true, limit: '200mb' }));
  app.use(cookieParser());

  // Ensure uploads directory exists and is statically served
  try {
    const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const uploadsDir = isServerless ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    app.use('/uploads', express.static(uploadsDir));
  } catch (e) {
    console.warn('[Server] Could not initialize uploads directory:', e);
  }

  // Router for API endpoints
  const apiRouter = express.Router();

  apiRouter.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      database: db.isMongo() ? 'MongoDB Atlas' : 'Cloud Firestore & Persistent Engine',
      environment: process.env.NETLIFY ? 'Netlify Functions' : 'Node.js Server',
    });
  });

  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/videos', videoRoutes);
  apiRouter.use('/users', userRoutes);
  apiRouter.use('/comments', commentRoutes);
  apiRouter.use('/playlists', playlistRoutes);
  apiRouter.use('/history', historyRoutes);
  apiRouter.use('/notifications', notificationRoutes);
  apiRouter.use('/admin', adminRoutes);
  apiRouter.use('/ai', geminiRoutes);
  apiRouter.use('/social', socialRoutes);

  // Safe fallback for live stream requests
  apiRouter.use('/livestreams', (req, res) => {
    res.json({ success: true, streams: [], data: [], message: 'Live streaming is not enabled' });
  });

  // Mount API router on both /api and Netlify Functions path
  app.use('/api', apiRouter);
  app.use('/.netlify/functions/api', apiRouter);

  // Catch-all 404 handler for any unhandled /api/* calls
  app.all(['/api/*', '/.netlify/functions/api/*'], (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  return app;
}

export const app = createApiApp();
