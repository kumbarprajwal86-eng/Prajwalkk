import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Link,
  CheckCircle,
  Sparkles,
  Youtube,
  Music2,
  Instagram,
  Video as VideoIcon,
  Film,
  Download,
  Globe,
  Share2
} from 'lucide-react';
import { api } from '../../lib/api';

interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  color: string;
  description: string;
  syncedCount: number;
}

interface SocialSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const SocialSyncModal: React.FC<SocialSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete
}) => {
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importCategory, setImportCategory] = useState('Trending');
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlatforms();
    }
  }, [isOpen]);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ platforms: SocialPlatform[] }>('/social/platforms');
      if (res.data && res.data.platforms) {
        setPlatforms(res.data.platforms);
      }
    } catch (err) {
      console.error('Failed to fetch platforms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async (platformId?: string) => {
    try {
      setSyncing(platformId || 'all');
      setMessage(null);
      const res = await api.post<{ message: string; totalVideos: number }>('/social/sync', {
        platform: platformId === 'all' ? undefined : platformId
      });

      setMessage({
        type: 'success',
        text: res.data.message || 'Social media server synced successfully!'
      });

      window.dispatchEvent(new CustomEvent('video-deleted', { detail: { sync: true } }));
      fetchPlatforms();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to sync with social media server.'
      });
    } finally {
      setSyncing(null);
    }
  };

  const handleImportUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) return;

    try {
      setIsImporting(true);
      setMessage(null);
      const res = await api.post<{ message: string }>('/social/import-url', {
        url: importUrl.trim(),
        title: importTitle.trim() || undefined,
        category: importCategory
      });

      setMessage({
        type: 'success',
        text: res.data.message || 'Video imported successfully from social media server!'
      });

      setImportUrl('');
      setImportTitle('');
      window.dispatchEvent(new CustomEvent('video-deleted', { detail: { import: true } }));
      fetchPlatforms();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to import video from social media URL.'
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  const renderIcon = (id: string) => {
    switch (id) {
      case 'youtube':
        return <Youtube className="w-5 h-5 text-[#FF0000]" />;
      case 'tiktok':
        return <Music2 className="w-5 h-5 text-[#00F2FE]" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-[#E1306C]" />;
      case 'pexels':
        return <VideoIcon className="w-5 h-5 text-[#05A081]" />;
      case 'vimeo':
        return <Film className="w-5 h-5 text-[#1AB7EA]" />;
      default:
        return <Globe className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0F131C] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-[#161B26] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF0000] via-[#E1306C] to-[#00F2FE] p-0.5 flex items-center justify-center shadow-lg">
              <div className="w-full h-full bg-[#0F131C] rounded-[14px] flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Social Media Server Integration
                <span className="px-2 py-0.5 bg-[#818CF8]/20 border border-[#818CF8]/30 text-[#818CF8] text-[10px] uppercase font-bold rounded-full">
                  Live Sync
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Connect and import video streams from YouTube, TikTok, Instagram & Pexels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Notification Alert */}
          {message && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                message.type === 'success'
                  ? 'bg-[#00C853]/15 border border-[#00C853]/30 text-[#00C853]'
                  : 'bg-[#FF4D6D]/15 border border-[#FF4D6D]/30 text-[#FF4D6D]'
              }`}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {/* Sync All Button */}
          <div className="bg-[#161B26] p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Sync All Social Media Streams
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Fetch and integrate curated HD videos and vertical shorts directly into your feed.
              </p>
            </div>
            <button
              onClick={() => handleSyncAll('all')}
              disabled={syncing !== null}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#FF0000] via-[#E1306C] to-[#818CF8] hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${syncing === 'all' ? 'animate-spin' : ''}`} />
              <span>{syncing === 'all' ? 'Syncing Server...' : 'Sync Social Feed Now'}</span>
            </button>
          </div>

          {/* Platforms Grid */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Connected Social Media Platforms
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {platforms.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 bg-[#161B26] border border-white/5 hover:border-white/20 rounded-2xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
                      {renderIcon(p.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{p.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00C853]" />
                      </div>
                      <p className="text-[11px] text-gray-400">{p.syncedCount} videos synced</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSyncAll(p.id)}
                    disabled={syncing === p.id}
                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                    title={`Sync ${p.name}`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing === p.id ? 'animate-spin text-[#818CF8]' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Direct URL Importer */}
          <div className="bg-[#161B26] p-4 rounded-2xl border border-white/5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Link className="w-4 h-4 text-[#818CF8]" />
              Import Video from Social Media URL
            </h3>
            <p className="text-xs text-gray-400">
              Paste a YouTube, TikTok, Instagram Reel, Pexels or direct video URL to integrate it instantly into your app.
            </p>

            <form onSubmit={handleImportUrl} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=... or https://tiktok.com/@user/video/..."
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0F131C] border border-white/10 focus:border-[#818CF8] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Custom Video Title (Optional)"
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0F131C] border border-white/10 focus:border-[#818CF8] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none"
                />

                <select
                  value={importCategory}
                  onChange={(e) => setImportCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F131C] border border-white/10 focus:border-[#818CF8] rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="Trending">Trending</option>
                  <option value="Technology">Technology</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Music">Music</option>
                  <option value="Shorts">Shorts</option>
                  <option value="Education">Education</option>
                  <option value="Fashion">Fashion</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isImporting || !importUrl.trim()}
                className="w-full py-2.5 bg-[#818CF8] hover:bg-[#818CF8]/90 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className={`w-4 h-4 ${isImporting ? 'animate-bounce' : ''}`} />
                <span>{isImporting ? 'Importing Video...' : 'Import Social Video'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#161B26] flex items-center justify-between text-xs text-gray-400">
          <span>Social Media Server v2.4 Active</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
