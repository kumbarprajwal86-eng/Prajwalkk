import { create } from 'zustand';
import { Video } from '../types';

interface PlayerState {
  activeMiniVideo: Video | null;
  isMiniPlayerOpen: boolean;
  watchLater: Video[];
  playlistQueue: Video[];
  currentQueueIndex: number;
  openMiniPlayer: (video: Video) => void;
  closeMiniPlayer: () => void;
  toggleWatchLater: (video: Video) => boolean;
  setPlaylistQueue: (videos: Video[], startIndex?: number) => void;
  nextInQueue: () => Video | null;
  prevInQueue: () => Video | null;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  activeMiniVideo: null,
  isMiniPlayerOpen: false,
  watchLater: JSON.parse(localStorage.getItem('viewpoint_watch_later') || '[]'),
  playlistQueue: [],
  currentQueueIndex: 0,

  openMiniPlayer: (video) => set({ activeMiniVideo: video, isMiniPlayerOpen: true }),
  closeMiniPlayer: () => set({ isMiniPlayerOpen: false }),

  toggleWatchLater: (video) => {
    const list = [...get().watchLater];
    const idx = list.findIndex((v) => v._id === video._id);
    let added = false;
    if (idx !== -1) {
      list.splice(idx, 1);
    } else {
      list.push(video);
      added = true;
    }
    localStorage.setItem('viewpoint_watch_later', JSON.stringify(list));
    set({ watchLater: list });
    return added;
  },

  setPlaylistQueue: (videos, startIndex = 0) => {
    set({ playlistQueue: videos, currentQueueIndex: startIndex });
  },

  nextInQueue: () => {
    const { playlistQueue, currentQueueIndex } = get();
    if (currentQueueIndex + 1 < playlistQueue.length) {
      const nextIdx = currentQueueIndex + 1;
      set({ currentQueueIndex: nextIdx });
      return playlistQueue[nextIdx];
    }
    return null;
  },

  prevInQueue: () => {
    const { playlistQueue, currentQueueIndex } = get();
    if (currentQueueIndex - 1 >= 0) {
      const prevIdx = currentQueueIndex - 1;
      set({ currentQueueIndex: prevIdx });
      return playlistQueue[prevIdx];
    }
    return null;
  },
}));
