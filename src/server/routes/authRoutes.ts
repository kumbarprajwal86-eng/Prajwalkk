import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { sendAccountNotification, getRuntimeSmtpConfig, setRuntimeSmtpConfig, clearRuntimeSmtpConfig } from '../services/mailService';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'viewpoint-super-secret-jwt-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'viewpoint-super-secret-refresh-key-2026';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_.\-]+$/, 'Username can only contain letters, numbers, underscores, dots, and hyphens'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  avatar: z.string().optional(),
  role: z.enum(['user', 'creator']).optional(),
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

const stripPassword = (user: any) => {
  if (!user) return user;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

// Generate Token
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

// Register
router.post('/register', async (req, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { name, email, username, password, avatar, role } = parsed.data;

    if (db.getUserByEmail(email)) {
      res.status(409).json({ error: 'Email address is already registered. Try signing in instead!', emailExists: true });
      return;
    }

    let finalUsername = username.toLowerCase().replace(/[^a-zA-Z0-9_.\-]/g, '');
    if (finalUsername.length < 3) finalUsername = `${finalUsername}user123`;
    if (db.getUsers().some(u => u.username.toLowerCase() === finalUsername)) {
      finalUsername = `${finalUsername}_${Math.floor(100 + Math.random() * 900)}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = db.createUser({
      name,
      email,
      username: finalUsername,
      passwordHash: hashedPassword,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      subscribersCount: 0,
      subscribedTo: [],
      likedVideos: [],
      dislikedVideos: [],
      savedPlaylists: [],
      role: role || 'creator',
      verified: false,
    });

    const { accessToken, refreshToken } = generateTokens(newUser._id);
    const emailNotification = await sendAccountNotification(newUser, true);

    res.cookie('token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 3600 * 1000 });
    res.status(201).json({ user: stripPassword(newUser), token: accessToken, refreshToken, emailNotification });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }

    const { email, password } = parsed.data;
    const user = db.getUserByEmailOrUsername(email);

    if (!user) {
      res.status(404).json({
        error: `Couldn't find your Viewpoint account with "${email}". Would you like to create one instead?`,
        notFound: true,
        suggestSignup: true,
        email: email,
      });
      return;
    }

    // Verify password if account has a hash
    if (user.passwordHash) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: 'Incorrect password. Please try again or use Forgot Password.' });
        return;
      }
    } else {
      // For seeded/demo accounts without passwordHash
      if (password !== 'password123' && password !== 'admin123' && password !== 'password' && password !== 'demo') {
        res.status(401).json({ error: "Incorrect password. For demo accounts, use password 'password123' or 'admin123'." });
        return;
      }
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    const emailNotification = await sendAccountNotification(user, false);

    res.cookie('token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 3600 * 1000 });
    res.json({ user: stripPassword(user), token: accessToken, refreshToken, emailNotification });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Google Login Simulation
router.post('/google', async (req, res: Response): Promise<void> => {
  try {
    const { email, name, avatar } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Google authentication failed: Email is required.' });
      return;
    }

    let user = db.getUserByEmail(email);
    let isNewAccount = false;
    if (!user) {
      isNewAccount = true;
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      user = db.createUser({
        name: name || 'Google User',
        email,
        username,
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        subscribersCount: 0,
        subscribedTo: [],
        likedVideos: [],
        dislikedVideos: [],
        savedPlaylists: [],
        role: (req.body.role as 'user' | 'creator') || 'creator',
        verified: false,
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    const emailNotification = await sendAccountNotification(user, isNewAccount);
    res.cookie('token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 3600 * 1000 });
    res.json({ user: stripPassword(user), token: accessToken, refreshToken, emailNotification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to authenticate with Google.' });
  }
});

// GitHub Login & Connect Simulation
router.post('/github', async (req, res: Response): Promise<void> => {
  try {
    const { email, name, avatar, username: customUsername } = req.body;
    const targetEmail = email || `${customUsername || 'github_user'}@users.noreply.github.com`;

    let user = db.getUserByEmail(targetEmail);
    let isNewAccount = false;
    if (!user) {
      isNewAccount = true;
      const username = customUsername || targetEmail.split('@')[0] + Math.floor(Math.random() * 1000);
      user = db.createUser({
        name: name || customUsername || 'GitHub Developer',
        email: targetEmail,
        username,
        avatar: avatar || `https://avatars.githubusercontent.com/u/${Math.floor(Math.random() * 1000000)}?v=4`,
        subscribersCount: 0,
        subscribedTo: [],
        likedVideos: [],
        dislikedVideos: [],
        savedPlaylists: [],
        role: 'creator',
        verified: true,
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    const emailNotification = await sendAccountNotification(user, isNewAccount);
    res.cookie('token', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 3600 * 1000 });
    res.json({ user: stripPassword(user), token: accessToken, refreshToken, emailNotification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to authenticate with GitHub.' });
  }
});

// Logout
router.post('/logout', (req, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});

// Current User (Me)
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ user: stripPassword(req.user) });
});

// SMTP Status
router.get('/smtp/status', (req, res: Response) => {
  res.json({ config: getRuntimeSmtpConfig() });
});

// Configure Runtime SMTP
router.post('/smtp/config', (req, res: Response): void => {
  const { user, pass, service, host, port } = req.body;
  if (!user || !pass) {
    res.status(400).json({ error: 'Gmail address and App Password are required.' });
    return;
  }
  try {
    const updated = setRuntimeSmtpConfig({ user, pass, service, host, port: Number(port) || 587 });
    res.json({ success: true, config: updated, message: 'Real Gmail SMTP connected successfully!' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to configure SMTP.' });
  }
});

// Clear Runtime SMTP
router.post('/smtp/clear', (req, res: Response) => {
  clearRuntimeSmtpConfig();
  res.json({ success: true, config: getRuntimeSmtpConfig() });
});

// Test SMTP Dispatch
router.post('/smtp/test', async (req, res: Response): Promise<void> => {
  const { email, name, user: smtpUser, pass: smtpPass } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Recipient email is required.' });
    return;
  }
  try {
    if (smtpUser && smtpPass) {
      setRuntimeSmtpConfig({ user: smtpUser, pass: smtpPass });
    }
    const targetUser = db.getUserByEmail(email) || {
      name: name || 'Prajwal K',
      email: email,
      username: email.split('@')[0],
      role: 'creator',
    };
    const result = await sendAccountNotification(targetUser, false);
    if (!result.success) {
      res.status(400).json({ error: result.errorDetails || 'Failed to dispatch email via SMTP.' });
      return;
    }
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send test email.' });
  }
});

export default router;
