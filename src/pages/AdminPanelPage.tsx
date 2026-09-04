import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Video as VideoIcon,
  HardDrive,
  Activity,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Award,
  Lock
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { User, Video } from '../types';

export const AdminPanelPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'videos' | 'system'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Note: if user is not admin, we can still show a notice or let them view demo admin mode
    const fetchAdminData = async () => {
      try {
        const [usersRes, videosRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/videos'),
        ]);
        setUsers(usersRes.data);
        setVideos(videosRes.data);
      } catch (err) {
        console.error('Failed to load admin data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, [user?._id]);

  if (!user) return null;

  if (user.role !== 'admin' && user.email !== 'admin@viewpoint.com' && user.email !== 'admin@viewpoint.io') {
    return (
      <div className="max-w-xl mx-auto my-24 p-8 bg-[#161B26] rounded-3xl border border-[#FF4D6D]/40 text-center space-y-4 shadow-2xl">
        <ShieldAlert className="w-16 h-16 text-[#FF4D6D] mx-auto animate-bounce" />
        <h2 className="text-2xl font-black text-white">Root Access Restricted</h2>
        <p className="text-sm text-gray-400">
          This panel is reserved for platform moderators and root system administrators. Your account ({user.name}) is currently assigned to the <span className="uppercase font-bold text-[#818CF8]">{user.role}</span> tier.
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-[#FF4D6D] text-white rounded-full font-bold text-xs shadow-lg"
          >
            Switch to Admin Demo Account
          </button>
        </div>
      </div>
    );
  }

  const toggleVerifyUser = async (userId: string, currentStatus?: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/verify`, { verified: !currentStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, verified: !currentStatus } : u))
      );
    } catch (err) {
      alert('Failed to update verification status.');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Delete user account "${name}" and all associated videos?`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  const handleDeleteVideo = async (videoId: string, title: string) => {
    if (!window.confirm(`Delete video "${title}" from VIEWPOINT servers?`)) return;
    try {
      await api.delete(`/admin/videos/${videoId}`);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
    } catch (err) {
      alert('Failed to delete video.');
    }
  };

  const handleDeleteAllVideos = async () => {
    if (!window.confirm('Are you sure you want to delete ALL videos across the entire platform? This action cannot be undone.')) return;
    try {
      await api.delete('/admin/videos/all');
      setVideos([]);
      window.dispatchEvent(new CustomEvent('video-deleted', { detail: { all: true } }));
      alert('All videos have been permanently deleted from the platform.');
    } catch (err) {
      alert('Failed to delete all videos.');
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.channelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FF4D6D] flex items-center justify-center shadow-lg shadow-[#FF4D6D]/40">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <span>System Admin Console</span>
              <span className="text-xs px-2.5 py-0.5 bg-[#FF4D6D] text-white rounded-full font-extrabold uppercase">ROOT</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">VIEWPOINT Control Plane • Server Node ID: us-central1-c-cdn04</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users or videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#161B26] border border-white/20 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#818CF8]"
            />
          </div>
          <button
            onClick={handleDeleteAllVideos}
            className="px-3.5 py-2 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-[#FF4D6D]/20"
            title="Delete all videos on the server"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge All Videos</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/10 overflow-x-auto pb-2 text-sm font-bold">
        {[
          { id: 'overview', label: 'Dashboard & Telemetry', icon: Activity },
          { id: 'users', label: `Users & Creators (${users.length})`, icon: Users },
          { id: 'videos', label: `Video Repository (${videos.length})`, icon: VideoIcon },
          { id: 'system', label: 'CDN & Storage Usage', icon: HardDrive },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive ? 'bg-[#FF4D6D] text-white font-extrabold shadow-md' : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'overview' ? (
        <div className="space-y-8">
          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
                <span>Registered Accounts</span>
                <Users className="w-5 h-5 text-[#818CF8]" />
              </div>
              <p className="text-3xl font-black text-white">{users.length}</p>
              <p className="text-xs text-[#00C853] font-semibold">100% active verified emails</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
                <span>Total Video Assets</span>
                <VideoIcon className="w-5 h-5 text-[#FF4D6D]" />
              </div>
              <p className="text-3xl font-black text-white">{videos.length}</p>
              <p className="text-xs text-gray-400">Including 4K and Shorts formats</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
                <span>Storage Footprint</span>
                <HardDrive className="w-5 h-5 text-[#FFD600]" />
              </div>
              <p className="text-3xl font-black text-[#FFD600]">{videos.length > 0 ? `${(videos.length * 0.2).toFixed(1)} GB` : '0 GB'}</p>
              <p className="text-xs text-gray-400">Distributed across Google Cloud Storage</p>
            </div>

            <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-2 shadow-xl">
              <div className="flex items-center justify-between text-gray-400 text-xs font-bold uppercase tracking-wider">
                <span>API Server Uptime</span>
                <Activity className="w-5 h-5 text-[#00C853]" />
              </div>
              <p className="text-3xl font-black text-[#00C853]">99.99%</p>
              <p className="text-xs text-gray-400">Node Express Engine • Healthy</p>
            </div>
          </div>

          {/* Quick Telemetry Bar */}
          <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white">System Logs & Moderation Alerts</h3>
            <div className="space-y-3 text-xs font-mono text-gray-300">
              <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between">
                <span>[LOG 09:18:24 UTC] • CDN Cache hit ratio exceeds 94.2% across North America nodes</span>
                <span className="text-[#00C853] font-bold">NORMAL</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between">
                <span>[LOG 09:15:10 UTC] • Gemini AI recommendation engine processed 1,420 token vectors</span>
                <span className="text-[#818CF8] font-bold">INFO</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between">
                <span>[LOG 09:12:02 UTC] • Root auth verified for administrator session token</span>
                <span className="text-[#FFD600] font-bold">SECURE</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider font-bold">
                <th className="pb-4">User / Creator Account</th>
                <th className="pb-4">Email</th>
                <th className="pb-4">Role</th>
                <th className="pb-4">Subscribers</th>
                <th className="pb-4">Verified Badge</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-white text-sm flex items-center gap-1">
                          <span>{u.name}</span>
                          {u.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#818CF8] fill-[#818CF8]/20" />}
                        </p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-gray-300 text-xs">{u.email}</td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      u.role === 'admin' ? 'bg-[#FF4D6D]/20 text-[#FF4D6D]' : u.role === 'creator' ? 'bg-[#818CF8]/20 text-[#818CF8]' : 'bg-white/10 text-gray-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-white">{u.subscribersCount > 0 ? (u.subscribersCount >= 1000 ? `${(u.subscribersCount / 1000).toFixed(1)}K` : u.subscribersCount) : 0}</td>
                  <td className="py-4">
                    <button
                      onClick={() => toggleVerifyUser(u._id, u.verified)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        u.verified ? 'bg-[#818CF8] text-black font-extrabold' : 'bg-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {u.verified ? '✓ Verified' : '+ Verify'}
                    </button>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(u._id, u.name)}
                      disabled={u.role === 'admin'}
                      className="p-2 bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 text-[#FF4D6D] rounded-lg disabled:opacity-30 transition-colors"
                      title="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'videos' ? (
        <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider font-bold">
                <th className="pb-4">Video Title & Format</th>
                <th className="pb-4">Channel</th>
                <th className="pb-4">Views</th>
                <th className="pb-4">Likes</th>
                <th className="pb-4">Category</th>
                <th className="pb-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-sm">
              {filteredVideos.map((vid) => (
                <tr key={vid._id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <img src={vid.thumbnailUrl} alt={vid.title} className="w-20 h-12 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-white text-sm line-clamp-1">{vid.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{vid.durationFormatted} • {vid.isShort ? '⚡ Short' : 'Standard'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 font-semibold text-gray-300 text-xs">{vid.channelName}</td>
                  <td className="py-4 font-bold text-white">{vid.views.toLocaleString()}</td>
                  <td className="py-4 font-bold text-[#818CF8]">{vid.likes.toLocaleString()}</td>
                  <td className="py-4"><span className="px-2 py-0.5 bg-white/10 rounded text-xs">#{vid.category}</span></td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => handleDeleteVideo(vid._id, vid.title)}
                      className="p-2 bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 text-[#FF4D6D] rounded-lg transition-colors"
                      title="Force delete video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-[#161B26] border border-white/10 text-center space-y-6">
          <HardDrive className="w-16 h-16 text-[#00C853] mx-auto animate-pulse" />
          <h3 className="text-2xl font-bold text-white">Google Cloud CDN & Storage Metrics</h3>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">
            All video streaming blobs and high-res thumbnail assets are distributed across edge CDN caches with automatic transcoding to H.264 and VP9.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400">Bandwidth (30d)</p>
              <p className="text-xl font-bold text-[#818CF8] mt-1">420.5 TB</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400">Transcode Workers</p>
              <p className="text-xl font-bold text-[#00C853] mt-1">24 Nodes Active</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400">DB Latency</p>
              <p className="text-xl font-bold text-[#FFD600] mt-1">1.2 ms</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
