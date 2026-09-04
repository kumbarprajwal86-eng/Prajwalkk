import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User as UserIcon,
  Edit3,
  Video as VideoIcon,
  ListVideo,
  ThumbsUp,
  History,
  CheckCircle2,
  Settings,
  Save,
  Plus,
  Trash2,
  Play,
  Camera,
  Image as ImageIcon,
  Github,
  Twitter,
  Instagram,
  Globe,
  Linkedin,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { Video, Playlist } from '../types';
import { VideoCard } from '../components/common/VideoCard';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { AvatarPicker } from '../components/common/AvatarPicker';
import { BannerPicker } from '../components/common/BannerPicker';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'videos' | 'playlists' | 'liked' | 'history' | 'about'>('videos');
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedVideos, setLikedVideos] = useState<Video[]>([]);
  const [historyVideos, setHistoryVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [banner, setBanner] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Direct upload refs and state for standard click-to-change feature
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isUpdatingBanner, setIsUpdatingBanner] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleDirectAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUpdatingAvatar(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        try {
          await updateProfile({
            name: user.name,
            bio: user.bio || '',
            avatar: dataUrl,
            banner: user.banner || '',
          });
          setAvatar(dataUrl);
          setToastMessage('✅ Profile picture updated directly!');
          setTimeout(() => setToastMessage(null), 4000);
        } catch (err) {
          alert('Failed to save avatar photo.');
        } finally {
          setIsUpdatingAvatar(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDirectBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUpdatingBanner(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

        try {
          await updateProfile({
            name: user.name,
            bio: user.bio || '',
            avatar: user.avatar,
            banner: dataUrl,
          });
          setBanner(dataUrl);
          setToastMessage('✅ Channel banner updated directly!');
          setTimeout(() => setToastMessage(null), 4000);
        } catch (err) {
          alert('Failed to save banner photo.');
        } finally {
          setIsUpdatingBanner(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setName(user.name);
    setBio(user.bio || '');
    setAvatar(user.avatar);
    setBanner(user.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80');
    setGithubUrl(user.socialLinks?.github || `https://github.com/${user.username}`);
    setTwitterUrl(user.socialLinks?.twitter || '');
    setInstagramUrl(user.socialLinks?.instagram || '');
    setWebsiteUrl(user.socialLinks?.website || '');
    setLinkedinUrl(user.socialLinks?.linkedin || '');

    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const [myVidsRes, myPlRes, allVidsRes, histRes] = await Promise.all([
          api.get(`/videos?creator=${user._id}`).catch(() => ({ data: [] })),
          api.get(`/playlists?userId=${user._id}`).catch(() => ({ data: [] })),
          api.get('/videos').catch(() => ({ data: [] })),
          api.get('/history').catch(() => ({ data: [] })),
        ]);

        setVideos(myVidsRes.data);
        setPlaylists(myPlRes.data);
        setHistoryVideos(histRes.data);

        // Filter liked videos from all videos list using user.likedVideos IDs
        const liked = allVidsRes.data.filter((v: Video) => user.likedVideos.includes(v._id));
        setLikedVideos(liked);
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user?._id]);

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
        banner: banner.trim(),
        socialLinks: {
          github: githubUrl.trim(),
          twitter: twitterUrl.trim(),
          instagram: instagramUrl.trim(),
          website: websiteUrl.trim(),
          linkedin: linkedinUrl.trim(),
        },
      });
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!window.confirm('Delete this playlist?')) return;
    try {
      await api.delete(`/playlists/${playlistId}`);
      setPlaylists((prev) => prev.filter((p) => p._id !== playlistId));
    } catch (err) {
      alert('Failed to delete playlist.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-16">
      {/* Hidden file inputs for direct click standard feature */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        onChange={handleDirectAvatarUpload}
        className="hidden"
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleDirectBannerUpload}
        className="hidden"
      />

      {/* Toast confirmation for direct upload */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00C853] text-black font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Channel Banner */}
      <div className="relative w-full h-44 sm:h-56 md:h-64 bg-[#161B26] overflow-hidden group rounded-2xl border border-white/10 shadow-lg">
        <img
          src={user.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80'}
          alt="Channel Banner"
          className="w-full h-full object-cover object-center transform transition-transform duration-500 group-hover:scale-101"
        />

        {isUpdatingBanner && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center gap-2 text-white font-bold text-sm z-10">
            <div className="w-5 h-5 border-2 border-[#FF4D6D] border-t-transparent rounded-full animate-spin" />
            <span>Updating banner...</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => !isUpdatingBanner && bannerInputRef.current?.click()}
          title="Click to change banner photo"
          className="absolute top-4 right-4 bg-black/75 hover:bg-black/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold border border-white/20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all shadow-xl cursor-pointer z-10"
        >
          <ImageIcon className="w-3.5 h-3.5 text-[#FF4D6D]" />
          <span>Change banner</span>
        </button>
      </div>

      {/* YouTube Standard Channel Header Info */}
      <div className="pt-6 pb-6 border-b border-white/10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
          {/* Channel Avatar */}
          <div
            className="relative group cursor-pointer flex-shrink-0"
            onClick={() => !isUpdatingAvatar && avatarInputRef.current?.click()}
            title="Click profile photo to change picture"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover shadow-2xl bg-[#161B26] ring-4 ring-black/40 transition-transform duration-300 group-hover:scale-102"
            />
            {isUpdatingAvatar ? (
              <div className="absolute inset-0 bg-black/80 rounded-full flex flex-col items-center justify-center ring-4 ring-[#FF4D6D]">
                <div className="w-6 h-6 border-2 border-[#FF4D6D] border-t-transparent rounded-full animate-spin mb-1" />
                <span className="text-[10px] font-black text-[#FF4D6D] uppercase tracking-wider">Updating...</span>
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white mb-0.5" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Edit photo</span>
              </div>
            )}
          </div>

          {/* Channel Info & Details */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{user.name}</h1>
              {user.verified && (
                <span className="p-0.5 bg-gray-400 text-black rounded-full shadow inline-flex" title="Verified Channel">
                  <CheckCircle2 className="w-4 h-4 stroke-[3] text-black" />
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-400 font-medium flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-white font-bold">@{user.username}</span>
              <span>•</span>
              <span>{user.subscribersCount > 0 ? (user.subscribersCount >= 1000000 ? `${(user.subscribersCount / 1000000).toFixed(2)}M` : user.subscribersCount >= 1000 ? `${(user.subscribersCount / 1000).toFixed(1)}K` : user.subscribersCount) : 0} subscribers</span>
              <span>•</span>
              <span>{videos.length} videos</span>
            </p>

            <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed font-normal">
              {user.bio || 'Welcome to my official ViewPoint channel! Click "Customize channel" to edit details, links, and banner.'}
              <button
                onClick={() => setActiveTab('about')}
                className="ml-1 text-xs font-bold text-gray-400 hover:text-white cursor-pointer underline inline-block"
              >
                ...more
              </button>
            </p>

            {/* Social Media Links Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {[
                { type: 'github', label: 'GitHub', icon: Github, url: user.socialLinks?.github || `https://github.com/${user.username}` },
                { type: 'twitter', label: 'Twitter / X', icon: Twitter, url: user.socialLinks?.twitter },
                { type: 'instagram', label: 'Instagram', icon: Instagram, url: user.socialLinks?.instagram },
                { type: 'website', label: 'Website', icon: Globe, url: user.socialLinks?.website },
                { type: 'linkedin', label: 'LinkedIn', icon: Linkedin, url: user.socialLinks?.linkedin },
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

        {/* Action Buttons (YouTube Channel Buttons) */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start md:justify-end gap-3 self-center md:self-start pt-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow cursor-pointer ${
              isEditing
                ? 'bg-[#FF4D6D] text-white shadow-[#FF4D6D]/30'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Close Customization' : 'Customize channel'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="px-5 py-2.5 rounded-full bg-white hover:bg-gray-200 text-black font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Manage videos</span>
          </button>
        </div>
      </div>

      {/* Minimized Standard YouTube Studio Channel Customization Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <form onSubmit={handleSaveProfile} className="relative w-full max-w-3xl my-auto p-6 sm:p-8 rounded-3xl bg-[#161B26] border-2 border-[#818CF8]/50 space-y-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#FF4D6D]" />
                  <span>Channel customization (YouTube Studio Standard)</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Update your channel branding, profile picture, banner, and basic info</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto space-y-6 pr-1 flex-grow">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-gray-300 uppercase tracking-wider">Channel Name (Display Title)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 focus:border-[#818CF8] rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none transition-all"
                  required
                />
                <p className="text-[11px] text-gray-500">Choose a channel title that represents you and your content.</p>
              </div>

              <div className="pt-2 border-t border-white/10">
                <AvatarPicker
                  currentAvatar={avatar}
                  onSelectAvatar={setAvatar}
                  label="Picture (Your Profile Photo & Channel Icon)"
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                <BannerPicker
                  currentBanner={banner}
                  onSelectBanner={setBanner}
                  label="Banner image (Appears across the top of your channel)"
                />
              </div>

              <div className="pt-4 border-t border-white/10 space-y-1.5">
                <label className="block text-xs font-extrabold text-gray-300 uppercase tracking-wider">Description (Channel Bio)</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell viewers about your channel, content schedule, and social links..."
                  className="w-full bg-black/60 border border-white/20 focus:border-[#818CF8] rounded-xl p-4 text-sm text-white focus:outline-none transition-all leading-relaxed"
                />
              </div>

              {/* Social Media Links Section */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <label className="block text-xs font-extrabold text-gray-300 uppercase tracking-wider">Social Media & Author Links</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-[#818CF8]" />
                      <span>GitHub</span>
                    </span>
                    <input
                      type="text"
                      placeholder="https://github.com/username"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 focus:border-[#818CF8] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                      <Twitter className="w-3.5 h-3.5 text-[#818CF8]" />
                      <span>Twitter / X</span>
                    </span>
                    <input
                      type="text"
                      placeholder="https://twitter.com/username"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 focus:border-[#818CF8] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                      <Instagram className="w-3.5 h-3.5 text-[#818CF8]" />
                      <span>Instagram</span>
                    </span>
                    <input
                      type="text"
                      placeholder="https://instagram.com/username"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 focus:border-[#818CF8] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#818CF8]" />
                      <span>Website / Portfolio</span>
                    </span>
                    <input
                      type="text"
                      placeholder="https://mywebsite.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 focus:border-[#818CF8] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-[#818CF8]" />
                      <span>LinkedIn</span>
                    </span>
                    <input
                      type="text"
                      placeholder="https://linkedin.com/in/username"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 focus:border-[#818CF8] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 flex-shrink-0">
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2.5 rounded-full text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={isSaving} className="px-8 py-2.5 rounded-full text-xs font-extrabold bg-[#3E63DD] hover:bg-[#3E63DD]/90 text-white flex items-center gap-2 shadow-lg transition-all transform hover:scale-102 cursor-pointer">
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Publishing...' : 'Publish changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="px-6 flex items-center gap-8 border-b border-white/10 overflow-x-auto text-sm font-bold pt-4">
        {[
          { id: 'videos', label: 'My Uploads', icon: VideoIcon, count: videos.length },
          { id: 'playlists', label: 'Playlists', icon: ListVideo, count: playlists.length },
          { id: 'liked', label: 'Liked Videos', icon: ThumbsUp, count: likedVideos.length },
          { id: 'history', label: 'Watch History', icon: History, count: historyVideos.length },
          { id: 'about', label: 'About', icon: UserIcon, count: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-[#FF4D6D] text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
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

      {/* Tab Content */}
      <div className="p-6">
        {isLoading ? (
          <SkeletonLoader type="grid" count={4} />
        ) : activeTab === 'videos' ? (
          <div>
            {videos.length === 0 ? (
              <div className="text-center py-16 bg-[#161B26]/40 rounded-3xl border border-white/10 space-y-4">
                <VideoIcon className="w-12 h-12 text-gray-500 mx-auto" />
                <h3 className="text-lg font-bold text-white">You haven't uploaded any videos yet</h3>
                <p className="text-xs text-gray-400">Launch your creator journey by uploading your first 4K stream or Short.</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="px-6 py-2.5 bg-[#FF4D6D] text-white rounded-full text-xs font-bold shadow-lg"
                >
                  Upload First Video
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((vid) => (
                  <VideoCard
                    key={vid._id}
                    video={vid}
                    onDelete={(deletedId) => setVideos(prev => prev.filter(v => v._id !== deletedId))}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'playlists' ? (
          <div>
            {playlists.length === 0 ? (
              <div className="text-center py-16 bg-[#161B26]/40 rounded-3xl border border-white/10 space-y-3">
                <ListVideo className="w-12 h-12 text-gray-500 mx-auto" />
                <h3 className="text-lg font-bold text-white">No playlists saved yet</h3>
                <p className="text-xs text-gray-400">Save your favorite masterclasses and beats into custom playlists.</p>
              </div>
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

                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-base group-hover:text-[#818CF8] transition-colors">{pl.title}</h4>
                        <p className="text-xs text-gray-400 capitalize mt-0.5">🌐 {pl.visibility} playlist</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist(pl._id);
                        }}
                        className="p-2 text-gray-400 hover:text-[#FF4D6D] transition-colors"
                        title="Delete playlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'liked' ? (
          <div>
            {likedVideos.length === 0 ? (
              <div className="text-center py-16 bg-[#161B26]/40 rounded-3xl border border-white/10 space-y-3">
                <ThumbsUp className="w-12 h-12 text-gray-500 mx-auto" />
                <h3 className="text-lg font-bold text-white">No liked videos yet</h3>
                <p className="text-xs text-gray-400">Give a thumbs up to videos you enjoy to save them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {likedVideos.map((vid) => (
                  <VideoCard key={vid._id} video={vid} />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'history' ? (
          <div>
            {historyVideos.length === 0 ? (
              <div className="text-center py-16 bg-[#161B26]/40 rounded-3xl border border-white/10 space-y-3">
                <History className="w-12 h-12 text-gray-500 mx-auto" />
                <h3 className="text-lg font-bold text-white">Watch history is empty</h3>
                <p className="text-xs text-gray-400">Videos you watch will appear here for easy re-watching.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {historyVideos.map((vid) => (
                  <VideoCard key={vid._id} video={vid} layout="list" />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl p-8 rounded-3xl bg-[#161B26] border border-white/10 space-y-6">
            <h3 className="text-xl font-bold text-white">About Channel</h3>
            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Biography & Description</p>
                <p className="mt-1 leading-relaxed whitespace-pre-wrap">{user.bio || 'No description provided.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Joined VIEWPOINT</p>
                  <p className="mt-1 font-bold text-white">October 14, 2024</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Total Channel Views</p>
                  <p className="mt-1 font-bold text-[#818CF8]">{videos.reduce((acc, v) => acc + v.views, 0).toLocaleString()} views</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
