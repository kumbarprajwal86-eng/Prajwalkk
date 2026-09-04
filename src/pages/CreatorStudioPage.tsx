import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BarChart3,
  Video as VideoIcon,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  Eye,
  ThumbsUp,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Share2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { Video } from '../types';
import { SocialSyncModal } from '../components/common/SocialSyncModal';
import { AIScriptGenerator } from '../components/studio/AIScriptGenerator';
import { formatVideoDuration } from '../utils/videoUtils';

export const CreatorStudioPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'analytics' | 'comments' | 'ai-generator'>('dashboard');
  const [isSocialSyncOpen, setIsSocialSyncOpen] = useState(false);

  const fetchMyVideos = async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/videos?creator=${user._id}`);
      setVideos(res.data);
    } catch (err) {
      console.error('Failed to load studio videos', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyVideos();
  }, [user?._id]);

  if (!user) return null;

  const totalViews = videos.reduce((acc, v) => acc + v.views, 0);
  const totalLikes = videos.reduce((acc, v) => acc + v.likes, 0);
  const estRevenue = ((totalViews / 1000) * 4.85).toFixed(2); // estimated $4.85 RPM

  const handleDeleteVideo = async (videoId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    try {
      const baseId = videoId.split('-more-')[0];
      await api.delete(`/videos/${baseId}`);
      window.dispatchEvent(new CustomEvent('video-deleted', { detail: { videoId, baseId } }));
      setVideos((prev) => prev.filter((v) => v._id !== videoId && v._id !== baseId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete video.');
    }
  };

  const handleRepublishVideo = async (videoId: string, title: string) => {
    try {
      const baseId = videoId.split('-more-')[0];
      const res = await api.post(`/videos/${baseId}/republish`);
      alert(`"${title}" has been successfully republished to the top of the feed!`);
      fetchMyVideos();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to republish video.');
    }
  };

  const handleDeleteAllVideos = async () => {
    if (!window.confirm('Are you sure you want to delete ALL videos in the app? This cannot be undone.')) return;
    try {
      await api.delete('/videos/all');
      setVideos([]);
      window.dispatchEvent(new CustomEvent('video-deleted', { detail: { all: true } }));
      alert('All videos have been deleted successfully.');
    } catch (err: any) {
      alert('Failed to delete all videos.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="relative group rounded-2xl overflow-hidden focus:outline-none"
            title="Click to update profile photo"
          >
            <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-lg group-hover:opacity-75 transition-opacity bg-gray-900" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Edit</span>
            </div>
          </button>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <span>Creator Studio</span>
              <span className="text-xs px-2.5 py-0.5 bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/30 rounded-full font-bold">PRO</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Welcome back, {user.name} • <button onClick={() => navigate('/profile')} className="text-[#818CF8] hover:underline font-bold bg-transparent border-none p-0 cursor-pointer">Update Profile Photo</button></p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setIsSocialSyncOpen(true)}
            className="px-4 py-3 bg-[#818CF8]/15 hover:bg-[#818CF8]/25 text-[#818CF8] border border-[#818CF8]/30 font-bold rounded-2xl flex items-center gap-2 text-sm transition-colors cursor-pointer"
            title="Sync videos from social media server"
          >
            <Share2 className="w-4 h-4" />
            <span>Sync Social Media</span>
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="px-5 py-3 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white font-bold rounded-2xl shadow-lg shadow-[#FF4D6D]/30 flex items-center gap-2 text-sm transition-transform hover:scale-105 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Video</span>
          </button>
          <button
            onClick={handleDeleteAllVideos}
            className="px-4 py-3 bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 text-[#FF4D6D] border border-[#FF4D6D]/30 font-bold rounded-2xl flex items-center gap-2 text-sm transition-colors cursor-pointer"
            title="Delete all videos in the application"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All Videos</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/10 overflow-x-auto pb-2 text-sm font-bold">
        {[
          { id: 'dashboard', label: 'Dashboard Overview', icon: BarChart3 },
          { id: 'ai-generator', label: 'AI Script & Idea Generator', icon: Sparkles, highlight: true },
          { id: 'content', label: `Content Management (${videos.length})`, icon: VideoIcon },
          { id: 'analytics', label: 'Audience Analytics', icon: TrendingUp },
          { id: 'comments', label: 'Channel Comments', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-black font-extrabold shadow-md'
                  : tab.highlight
                  ? 'bg-gradient-to-r from-[#FF4D6D]/20 to-purple-600/20 text-[#FF4D6D] border border-[#FF4D6D]/30 hover:bg-[#FF4D6D]/30'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.highlight && !isActive ? 'animate-pulse text-[#FF4D6D]' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content for Tabs */}
      {activeTab === 'dashboard' ? (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
                <span>Total Channel Views</span>
                <Eye className="w-5 h-5 text-[#818CF8]" />
              </div>
              <p className="text-3xl font-black text-white">{(totalViews >= 1000000 ? `${(totalViews / 1000000).toFixed(2)}M` : totalViews.toLocaleString())}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span>0% vs last 28 days</span>
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
                <span>Subscribers</span>
                <Users className="w-5 h-5 text-[#00C853]" />
              </div>
              <p className="text-3xl font-black text-white">{user.subscribersCount > 0 ? (user.subscribersCount >= 1000000 ? `${(user.subscribersCount / 1000000).toFixed(2)}M` : user.subscribersCount >= 1000 ? `${(user.subscribersCount / 1000).toFixed(1)}K` : user.subscribersCount) : 0}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <span>+0 new subscribers</span>
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
                <span>Estimated Revenue</span>
                <DollarSign className="w-5 h-5 text-[#FFD600]" />
              </div>
              <p className="text-3xl font-black text-[#FFD600]">${estRevenue}</p>
              <p className="text-xs text-gray-400">Avg. RPM $4.85 / 1k views</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
                <span>Total Engagements</span>
                <ThumbsUp className="w-5 h-5 text-[#FF4D6D]" />
              </div>
              <p className="text-3xl font-black text-white">{totalLikes.toLocaleString()}</p>
              <p className="text-xs text-[#818CF8] font-semibold">{totalLikes > 0 ? '100% positive rating ratio' : '0% positive rating ratio'}</p>
            </div>
          </div>

          {/* Recent Uploads Quick View */}
          <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Latest Video Performance</h3>
              <button onClick={() => setActiveTab('content')} className="text-xs font-bold text-[#818CF8] hover:underline">
                View All Videos →
              </button>
            </div>

            {videos.slice(0, 3).map((v) => (
              <div key={v._id} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <img src={v.thumbnailUrl} alt={v.title} className="w-28 h-16 rounded-xl object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">{v.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">Published on {new Date(v.createdAt).toLocaleDateString()} • #{v.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 text-xs text-gray-300 font-bold self-end sm:self-auto">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4 text-gray-400" /> {v.views.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4 text-[#818CF8]" /> {v.likes.toLocaleString()}</span>
                  <Link to={`/watch/${v._id}`} className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">Watch</Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(v._id, v.title)}
                    className="p-2 bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 text-[#FF4D6D] rounded-xl transition-colors cursor-pointer"
                    title="Delete video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'content' ? (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider font-bold">
                  <th className="pb-4">Video Content</th>
                  <th className="pb-4">Visibility</th>
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Views</th>
                  <th className="pb-4">Likes</th>
                  <th className="pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm">
                {videos.map((vid) => (
                  <tr key={vid._id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <img src={vid.thumbnailUrl} alt={vid.title} className="w-20 h-12 rounded-lg object-cover flex-shrink-0" />
                        <div>
                          <p className="font-bold text-white text-sm line-clamp-1">{vid.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatVideoDuration(vid.duration, vid.durationFormatted)} • #{vid.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-semibold text-[#00C853] text-xs">🌐 Public</td>
                    <td className="py-4 text-gray-300 text-xs">{new Date(vid.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 font-bold text-white">{vid.views.toLocaleString()}</td>
                    <td className="py-4 font-bold text-[#818CF8]">{vid.likes.toLocaleString()}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/watch/${vid._id}`}
                          className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                          title="Watch video"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleRepublishVideo(vid._id, vid.title)}
                          className="px-2.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                          title="Republish video to top of feed"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Republish</span>
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(vid._id, vid.title)}
                          className="p-2 bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 text-[#FF4D6D] rounded-lg transition-colors"
                          title="Delete video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {videos.length === 0 && (
              <div className="text-center py-16 text-gray-500">No uploads found. Start uploading to populate studio.</div>
            )}
          </div>
        </div>
      ) : activeTab === 'analytics' ? (
        <div className="p-8 rounded-3xl bg-[#161B26] border border-white/10 space-y-6 text-center">
          <BarChart3 className="w-16 h-16 text-[#818CF8] mx-auto animate-pulse" />
          <h3 className="text-2xl font-bold text-white">Deep Audience Insights & Retention Graphs</h3>
          <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
            Your channel analytics are computed live based on your audience engagement and video performance.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400">Click-Through Rate (CTR)</p>
              <p className="text-xl font-bold text-gray-400 mt-1">0%</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400">Unique Viewers</p>
              <p className="text-xl font-bold text-white mt-1">{totalViews.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400">Returning Viewer Ratio</p>
              <p className="text-xl font-bold text-[#818CF8] mt-1">0%</p>
            </div>
          </div>
        </div>
      ) : activeTab === 'ai-generator' ? (
        <AIScriptGenerator />
      ) : (
        <div className="p-8 rounded-3xl bg-[#161B26] border border-white/10 text-center space-y-4">
          <MessageSquare className="w-16 h-16 text-gray-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">Community Engagement Hub</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            All viewer comments across your {videos.length} uploaded videos can be reviewed and moderated directly from your watch pages.
          </p>
          <button onClick={() => setActiveTab('content')} className="px-6 py-2.5 bg-white/10 text-white rounded-full text-xs font-bold">
            Go to Videos
          </button>
        </div>
      )}

      {/* Social Media Sync Modal */}
      <SocialSyncModal
        isOpen={isSocialSyncOpen}
        onClose={() => setIsSocialSyncOpen(false)}
        onSyncComplete={fetchMyVideos}
      />
    </div>
  );
};
