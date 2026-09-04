import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Trash2, Pause, Play, Video as VideoIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { api } from '../lib/api';
import { Video } from '../types';
import { VideoCard } from '../components/common/VideoCard';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

export const HistoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const { historyPaused, toggleHistoryPaused } = useThemeStore();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchHistory = async () => {
      try {
        const res = await api.get('/history');
        const historyData = res.data || [];
        const extractedVideos: Video[] = historyData
          .map((item: any) => item.video || item)
          .filter((v: any) => v && v._id);
        setVideos(extractedVideos);
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();

    const handleVideoDeleted = (e: any) => {
      const deletedId = e.detail?.videoId;
      const baseId = e.detail?.baseId || deletedId;
      if (deletedId) {
        setVideos((prev) => prev.filter((v) => v._id !== deletedId && v._id !== baseId));
      }
    };
    window.addEventListener('video-deleted', handleVideoDeleted);
    return () => window.removeEventListener('video-deleted', handleVideoDeleted);
  }, [user?._id]);

  if (!user) return null;

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your entire watch history?')) return;
    try {
      await api.delete('/history');
      setVideos([]);
    } catch (err) {
      alert('Failed to clear history.');
    }
  };

  const handleRemoveFromHistory = async (videoId: string) => {
    try {
      await api.delete(`/history/${videoId}`);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch (err) {
      alert('Failed to remove video from history.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <History className="w-7 h-7 text-[#FF4D6D]" />
            <span>Watch History</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Review and manage all videos you have previously streamed across devices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleHistoryPaused}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all border ${
              historyPaused
                ? 'bg-[#FFD600]/20 border-[#FFD600] text-[#FFD600]'
                : 'bg-[#161B26] hover:bg-[#1F2633] text-gray-200 border-white/15'
            }`}
          >
            {historyPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{historyPaused ? 'Resume History' : 'Pause History'}</span>
          </button>

          {videos.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-4 py-2.5 bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 text-[#FF4D6D] border border-[#FF4D6D]/30 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {historyPaused && (
        <div className="p-4 rounded-2xl bg-[#FFD600]/10 border border-[#FFD600]/30 text-[#FFD600] text-sm font-semibold flex items-center gap-2">
          <span>⚠️ Watch history is currently paused. Videos you stream now will not be saved.</span>
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader type="list" count={6} />
      ) : videos.length === 0 ? (
        <div className="text-center py-20 bg-[#161B26]/40 rounded-3xl border border-white/10 space-y-4">
          <VideoIcon className="w-16 h-16 text-gray-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">Your watch history is empty</h3>
          <p className="text-xs text-gray-400">Videos you watch while signed in will show up here.</p>
          <button onClick={() => navigate('/home')} className="px-6 py-2.5 bg-[#FF4D6D] text-white rounded-full text-xs font-bold shadow-lg">
            Start Watching
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((vid) => (
            <VideoCard key={vid._id} video={vid} layout="list" onDelete={handleRemoveFromHistory} />
          ))}
        </div>
      )}
    </div>
  );
};
