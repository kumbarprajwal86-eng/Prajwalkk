import { create } from 'zustand';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  suggestSignupEmail: string | null;
  clearSuggestSignup: () => void;
  emailNotification: any | null;
  clearEmailNotification: () => void;
  authPrompt: { isOpen: boolean; message: string } | null;
  openAuthPrompt: (message?: string) => void;
  closeAuthPrompt: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  googleLogin: (email: string, name: string, avatar?: string) => Promise<void>;
  githubLogin: (username: string, email?: string, name?: string, avatar?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  toggleSubscribe: (channelId: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('viewpoint_token'),
  isLoading: true,
  error: null,
  suggestSignupEmail: null,
  authPrompt: null,
  emailNotification: null,

  clearSuggestSignup: () => set({ suggestSignupEmail: null, error: null }),
  clearEmailNotification: () => set({ emailNotification: null }),
  openAuthPrompt: (message = 'Sign in to make your opinion count and join the conversation.') =>
    set({ authPrompt: { isOpen: true, message } }),
  closeAuthPrompt: () => set({ authPrompt: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null, suggestSignupEmail: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token, emailNotification } = res.data;
      localStorage.setItem('viewpoint_token', token);
      set({ user, token, isLoading: false, emailNotification: emailNotification || null });
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.error || 'Login failed';
      const suggestSignup = data?.suggestSignup || false;
      const emailParam = data?.email || email;
      set({
        error: msg,
        isLoading: false,
        suggestSignupEmail: suggestSignup ? emailParam : null,
      });
      throw new Error(msg);
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null, suggestSignupEmail: null });
    try {
      const res = await api.post('/auth/register', data);
      const { user, token, emailNotification } = res.data;
      localStorage.setItem('viewpoint_token', token);
      set({ user, token, isLoading: false, emailNotification: emailNotification || null });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  googleLogin: async (email, name, avatar) => {
    set({ isLoading: true, error: null, suggestSignupEmail: null });
    try {
      const res = await api.post('/auth/google', { email, name, avatar });
      const { user, token, emailNotification } = res.data;
      localStorage.setItem('viewpoint_token', token);
      set({ user, token, isLoading: false, emailNotification: emailNotification || null });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Google login failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  githubLogin: async (username, email, name, avatar) => {
    set({ isLoading: true, error: null, suggestSignupEmail: null });
    try {
      const res = await api.post('/auth/github', { username, email, name, avatar });
      const { user, token, emailNotification } = res.data;
      localStorage.setItem('viewpoint_token', token);
      set({ user, token, isLoading: false, emailNotification: emailNotification || null });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'GitHub login failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('viewpoint_token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('viewpoint_token');
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, isLoading: false });
    } catch (err) {
      localStorage.removeItem('viewpoint_token');
      set({ user: null, token: null, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const res = await api.put('/users/profile', data);
    set({ user: res.data.user });
  },

  toggleSubscribe: async (channelId) => {
    const user = get().user;
    if (!user) {
      get().openAuthPrompt('Want to subscribe to this channel? Sign in to make your opinion count.');
      return false;
    }
    const res = await api.post(`/users/${channelId}/subscribe`);
    const { isSubscribed, subscribedTo } = res.data;
    set({ user: { ...user, subscribedTo } });
    return isSubscribed;
  },
}));
