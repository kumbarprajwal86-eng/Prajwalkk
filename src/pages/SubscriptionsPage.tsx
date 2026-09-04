import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Users, Video as VideoIcon, CheckCircle2, Check, Plus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { Video, User } from '../types';
import { VideoCard } from '../components/common/VideoCard';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

export const SubscriptionsPage: React.FC = () => {
  const { user, toggleSubscribe } = useAuthStore();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<Video[]>([]);
  const [subscribedChannels, setSubscribedChannels] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'channels'>('feed');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchSubscriptionsData = async () => {
      try {
        const [vidsRes, chRes] = await Promise.all([
          api.get('/users/subscriptions/videos'),
          api.get('/users/channels'),
        ]);

        setVideos(vidsRes.data);

        // Filter subscribed channels
        const subs = chRes.data.filter((c: User) => user.subscribedTo.includes(c._id));
        setSubscribedChannels(subs);
      } catch (err) {
        console.error('Failed to load subscriptions', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscriptionsData();

    const handleVideoDeleted = (e: any) => {
      const deletedId = e.detail?.videoId;
      const baseId = e.detail?.baseId || deletedId;
      if (deletedId) {
        setVideos((prev) => prev.filter((v) => v._id !== deletedId && v._id !== baseId));
      }
    };
    window.addEventListener('video-deleted', handleVideoDeleted);
    return () => window.removeEventListener('video-deleted', handleVideoDeleted);
  }, [user?.subscribedTo]);

  if (!user) return null;

  const handleUnsubscribe = async (channelId: string, channelName: string) => {
    if (!window.confirm(`Unsubscribe from ${channelName}?`)) return;
    await toggleSubscribe(channelId);
    setSubscribedChannels((prev) => prev.filter((c) => c._id !== channelId));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-7 h-7 text-[#FF4D6D] fill-[#FF4D6D]" />
            <span>Subscriptions Feed</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Stay updated with the latest high-definition streams from your favorite creator channels.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#161B26] p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'feed' ? 'bg-[#FF4D6D] text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Latest Uploads ({videos.length})
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'channels' ? 'bg-[#818CF8] text-black shadow font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            My Channels ({subscribedChannels.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader type="grid" count={8} />
      ) : activeTab === 'feed' ? (
        <div>
          {videos.length === 0 ? (
            <div className="text-center py-20 bg-[#161B26]/40 rounded-3xl border border-white/10 space-y-4">
              <VideoIcon className="w-16 h-16 text-gray-500 mx-auto" />
              <h3 className="text-xl font-bold text-white">No new videos in your subscriptions feed</h3>
              <p className="text-xs text-gray-400">Subscribe to more verified creators to fill your feed with fresh masterclasses.</p>
              <button onClick={() => navigate('/home')} className="px-6 py-2.5 bg-[#FF4D6D] text-white rounded-full text-xs font-bold shadow-lg">
                Explore Trending Channels
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((vid) => (
                <VideoCard key={vid._id} video={vid} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {subscribedChannels.length === 0 ? (
            <div className="text-center py-20 bg-[#161B26]/40 rounded-3xl border border-white/10 space-y-3">
              <Users className="w-16 h-16 text-gray-500 mx-auto" />
              <h3 className="text-xl font-bold text-white">You aren't subscribed to any channels yet</h3>
              <p className="text-xs text-gray-400">Discover and follow creators from the explore page.</p>
              <button onClick={() => navigate('/home')} className="px-6 py-2 bg-white/10 text-white rounded-full text-xs font-bold">
                Browse Creators
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscribedChannels.map((ch) => (
                <div
                  key={ch._id}
                  onClick={() => navigate(`/channel/${ch._id}`)}
                  className="p-5 rounded-3xl bg-[#161B26] hover:bg-[#1F2633] border border-white/10 cursor-pointer transition-all hover:-translate-y-1 flex items-center justify-between gap-4 group shadow-lg"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img src={ch.avatar} alt={ch.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-base flex items-center gap-1.5 truncate group-hover:text-[#818CF8]">
                        <span>{ch.name}</span>
                        {ch.verified && <CheckCircle2 className="w-4 h-4 text-[#818CF8] fill-[#818CF8]/20" />}
                      </h4>
                      <p className="text-xs text-gray-400">@{ch.username} • {ch.subscribersCount > 0 ? (ch.subscribersCount >= 1000000 ? `${(ch.subscribersCount / 1000000).toFixed(2)}M` : ch.subscribersCount >= 1000 ? `${(ch.subscribersCount / 1000).toFixed(1)}K` : ch.subscribersCount) : 0} subs</p>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-1">{ch.bio}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnsubscribe(ch._id, ch.name);
                    }}
                    className="px-4 py-1.5 bg-white/10 hover:bg-[#FF4D6D] text-white rounded-full text-xs font-bold transition-all flex items-center gap-1 flex-shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Subscribed</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
