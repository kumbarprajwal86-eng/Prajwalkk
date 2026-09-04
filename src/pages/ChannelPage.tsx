import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Video as VideoIcon,
  ListVideo,
  CheckCircle2,
  Bell,
  Plus,
  Check,
  Share2,
  Film,
  Github,
  Twitter,
  Instagram,
  Globe,
  Linkedin,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { User, Video, Playlist } from '../types';
import { VideoCard } from '../components/common/VideoCard';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

export const ChannelPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, toggleSubscribe } = useAuthStore();
  const navigate = useNavigate();

  const [channel, setChannel] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'shorts' | 'playlists' | 'about'>('videos');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchChannelData = async () => {
      setIsLoading(true);
      try {
        const [chRes, vidsRes, shortsRes, plRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/videos?creator=${id}&isShort=false`),
          api.get(`/videos?creator=${id}&isShort=true`),
          api.get(`/playlists?userId=${id}`),
        ]);

        const ch: User = chRes.data.user;
        setChannel(ch);
        setVideos(vidsRes.data);
        setShorts(shortsRes.data);
        setPlaylists(plRes.data.filter((p: Playlist) => p.visibility === 'public'));
        setSubscribersCount(ch.subscribersCount);

        if (user) {
          setIsSubscribed(user.subscribedTo.includes(id));
        }
      } catch (err) {
        console.error('Failed to load channel', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannelData();
  }, [id, user?._id]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6 animate-pulse">
        <div className="w-full h-48 sm:h-64 bg-[#161B26] rounded-3xl" />
        <div className="flex gap-6 items-end -mt-16 px-6">
          <div className="w-32 h-32 rounded-full bg-[#1F2633]" />
          <div className="space-y-2 flex-1">
            <div className="w-64 h-8 bg-[#1F2633] rounded" />
            <div className="w-40 h-4 bg-[#1F2633] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="text-center py-24 text-white space-y-4">
        <h2 className="text-2xl font-bold">Channel Not Found</h2>
        <p className="text-gray-400 text-sm">This channel does not exist or has been removed.</p>
        <button onClick={() => navigate('/home')} className="px-6 py-2 bg-[#FF4D6D] rounded-full text-xs font-bold">
          Return Home
        </button>
      </div>
    );
  }

  const handleSubscribeClick = async () => {
    if (!user) {
      alert('Please sign in to subscribe to creators.');
      return;
    }
    const nextSub = await toggleSubscribe(channel._id);
    setIsSubscribed(nextSub);
    setSubscribersCount((prev) => (nextSub ? prev + 1 : Math.max(0, prev - 1)));
  };

  return (
    <div className="max-w-7xl mx-auto pb-16">
      {/* Channel Banner */}
      <div className="relative w-full h-44 sm:h-56 md:h-64 bg-[#161B26] overflow-hidden rounded-2xl border border-white/10 shadow-lg">
        <img
          src={channel.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80'}
          alt="Channel Banner"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* YouTube Standard Channel Header Info */}
      <div className="pt-6 pb-6 border-b border-white/10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src={channel.avatar}
              alt={channel.name}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover shadow-2xl bg-[#161B26] ring-4 ring-black/40"
            />
          </div>

          {/* Details */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{channel.name}</h1>
              {channel.verified && (
                <span className="p-0.5 bg-gray-400 text-black rounded-full shadow inline-flex" title="Verified Channel">
                  <CheckCircle2 className="w-4 h-4 stroke-[3] text-black" />
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-400 font-medium flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-white font-bold">@{channel.username}</span>
              <span>•</span>
              <span>{subscribersCount > 0 ? (subscribersCount >= 1000000 ? `${(subscribersCount / 1000000).toFixed(2)}M` : subscribersCount >= 1000 ? `${(subscribersCount / 1000).toFixed(1)}K` : subscribersCount) : 0} subscribers</span>
              <span>•</span>
              <span>{videos.length + shorts.length} videos</span>
            </p>

            <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed font-normal">
              {channel.bio || 'Official channel on VIEWPOINT.'}
            </p>

            {/* Social Links */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {[
                { type: 'github', label: 'GitHub', icon: Github, url: channel.socialLinks?.github || `https://github.com/${channel.username}` },
                { type: 'twitter', label: 'Twitter', icon: Twitter, url: channel.socialLinks?.twitter },
                { type: 'instagram', label: 'Instagram', icon: Instagram, url: channel.socialLinks?.instagram },
                { type: 'website', label: 'Website', icon: Globe, url: channel.socialLinks?.website },
                { type: 'linkedin', label: 'LinkedIn', icon: Linkedin, url: channel.socialLinks?.linkedin },
              ]
                .filter((item) => Boolean(item.url))
                .map((item) => {
                  const Icon = item.icon;
                  const formattedUrl = item.url!.startsWith('http') ? item.url! : `https://${item.url!}`;
                  const cleanDomain = item.url!.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
                  return (
                    <a
                      key={item.type}
                      href={formattedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/15 text-white rounded-full text-xs font-semibold transition-all border border-white/10 cursor-pointer shadow-sm"
                      title={`Visit ${item.label}`}
                    >
                      <Icon className="w-3.5 h-3.5 text-[#818CF8]" />
                      <span className="truncate max-w-[140px]">{cleanDomain}</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          {user?._id !== channel._id ? (
            <button
              onClick={handleSubscribeClick}
              className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                isSubscribed
                  ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  : 'bg-white text-black hover:bg-gray-200 shadow-md'
              }`}
            >
              {isSubscribed ? (
                <>
                  <Bell className="w-4 h-4 fill-white text-white" />
                  <span>Subscribed</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Subscribe</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => navigate('/profile')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-xs sm:text-sm border border-white/15 cursor-pointer"
            >
              Customize channel
            </button>
          )}

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Channel URL copied to clipboard!');
            }}
            className="p-3 bg-[#161B26] hover:bg-[#1F2633] text-white rounded-full border border-white/15"
            title="Share channel"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 flex items-center gap-8 border-b border-white/10 overflow-x-auto text-sm font-bold pt-4">
        {[
          { id: 'videos', label: 'Videos', count: videos.length },
          { id: 'shorts', label: 'Shorts', count: shorts.length },
          { id: 'playlists', label: 'Playlists', count: playlists.length },
          { id: 'about', label: 'About', count: null },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                isActive ? 'border-[#FF4D6D] text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-[#FF4D6D]/20 text-[#FF4D6D]' : 'bg-white/10 text-gray-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'videos' ? (
          videos.length === 0 ? (
            <div className="text-center py-16 text-gray-500 font-medium">No standard videos uploaded yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((vid) => (
                <VideoCard
                  key={vid._id}
                  video={vid}
                  onDelete={(deletedId) => setVideos((prev) => prev.filter((v) => v._id !== deletedId))}
                />
              ))}
            </div>
          )
        ) : activeTab === 'shorts' ? (
          shorts.length === 0 ? (
            <div className="text-center py-16 text-gray-500 font-medium">No Shorts uploaded yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {shorts.map((short) => (
                <div
                  key={short._id}
                  onClick={() => navigate('/shorts')}
                  className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-900 cursor-pointer group shadow-lg transition-transform hover:-translate-y-1"
                >
                  <img src={short.thumbnailUrl} alt={short.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3 flex flex-col justify-end">
                    <h4 className="text-xs font-bold text-white line-clamp-2">{short.title}</h4>
                    <p className="text-[10px] text-gray-300 mt-1">{(short.views / 1000).toFixed(1)}K views</p>
                  </div>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete "${short.title}"?`)) {
                        try {
                          await api.delete(`/videos/${short._id}`);
                          setShorts((prev) => prev.filter((s) => s._id !== short._id));
                        } catch (err: any) {
                          alert(err.response?.data?.error || 'Failed to delete short.');
                        }
                      }
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-[#FF4D6D] text-white rounded-full transition-all shadow-md z-20 cursor-pointer"
                    title="Delete Short"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'playlists' ? (
          playlists.length === 0 ? (
            <div className="text-center py-16 text-gray-500 font-medium">No public playlists created yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((pl) => (
                <div
                  key={pl._id}
                  onClick={() => pl.videos[0] && navigate(`/watch/${pl.videos[0]._id}`)}
                  className="p-5 rounded-3xl bg-[#161B26] hover:bg-[#1F2633] border border-white/10 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden shadow-lg"
                >
                  <div className="aspect-video rounded-2xl overflow-hidden bg-black mb-4 relative">
                    {pl.videos[0] ? (
                      <img src={pl.videos[0].thumbnailUrl} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">Empty Playlist</div>
                    )}
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-1 text-white border-l border-white/10">
                      <ListVideo className="w-6 h-6 text-[#818CF8]" />
                      <span className="text-xs font-bold">{pl.videos.length} videos</span>
                    </div>
                  </div>
                  <h4 className="font-bold text-white text-base">{pl.title}</h4>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">🌐 Public playlist</p>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="max-w-3xl p-8 rounded-3xl bg-[#161B26] border border-white/10 space-y-6">
            <h3 className="text-xl font-bold text-white">About {channel.name}</h3>
            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Biography & Description</p>
                <p className="mt-1 leading-relaxed whitespace-pre-wrap">{channel.bio || 'No description provided.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Verified Handle</p>
                  <p className="mt-1 font-bold text-white">@{channel.username}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Total Subscribers</p>
                  <p className="mt-1 font-bold text-[#818CF8]">{subscribersCount > 0 ? (subscribersCount >= 1000000 ? `${(subscribersCount / 1000000).toFixed(2)}M` : subscribersCount >= 1000 ? `${(subscribersCount / 1000).toFixed(1)}K` : subscribersCount) : 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
