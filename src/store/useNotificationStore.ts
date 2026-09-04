import { create } from 'zustand';
import { Notification } from '../types';
import { api } from '../lib/api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      const notifs: Notification[] = res.data;
      const unread = notifs.filter((n) => !n.isRead).length;
      set({ notifications: notifs, unreadCount: unread });
    } catch (e) {
      // ignore if unauthenticated
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n));
        return {
          notifications: updated,
          unreadCount: updated.filter((n) => !n.isRead).length,
        };
      });
    } catch (e) {
      // ignore
    }
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },
}));
