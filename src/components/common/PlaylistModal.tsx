import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Lock, Globe, ListVideo } from 'lucide-react';
import { Video, Playlist } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';

interface PlaylistModalProps {
  video: Video | null;
  onClose: () => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({ video, onClose }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVisibility, setNewVisibility] = useState<'public' | 'private'>('public');
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  const { user } = useAuthStore();

  useEffect(() => {
    if (!video || !user) return;
    const fetchPlaylists = async () => {
      try {
        const res = await api.get(`/playlists?userId=${user._id}`);
        const list: Playlist[] = res.data;
        setPlaylists(list);

        const map: Record<string, boolean> = {};
        list.forEach((p) => {
          map[p._id] = p.videos.some((v) => v._id === video._id);
        });
        setAddedMap(map);
      } catch (err) {
        console.error('Failed to fetch playlists', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlaylists();
  }, [video, user]);

  if (!video) return null;

  const handleToggleVideo = async (playlistId: string) => {
    try {
      const res = await api.post(`/playlists/${playlistId}/videos`, { videoId: video._id });
      setAddedMap((prev) => ({ ...prev, [playlistId]: res.data.isAdded }));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update playlist.');
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;
    try {
      const res = await api.post('/playlists', {
        title: newTitle.trim(),
        visibility: newVisibility,
        videoId: video._id,
      });
      const newPl = res.data;
      setPlaylists([newPl, ...playlists]);
      setAddedMap((prev) => ({ ...prev, [newPl._id]: true }));
      setNewTitle('');
      setShowCreateForm(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create playlist.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161B26] border border-white/15 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ListVideo className="w-5 h-5 text-[#818CF8]" />
            <span>Save to playlist</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Playlists List */}
        <div className="p-5 max-h-80 overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="text-center py-6 text-gray-400 text-sm">Loading playlists...</div>
          ) : playlists.length === 0 && !showCreateForm ? (
            <div className="text-center py-6 text-gray-400 text-sm">No playlists created yet.</div>
          ) : (
            playlists.map((pl) => {
              const isAdded = addedMap[pl._id] || false;
              return (
                <div
                  key={pl._id}
                  onClick={() => handleToggleVideo(pl._id)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                      isAdded ? 'bg-[#818CF8] border-[#818CF8] text-black' : 'border-white/30 text-transparent'
                    }`}>
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{pl.title}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        {pl.visibility === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        <span className="capitalize">{pl.visibility}</span> • {pl.videos.length} videos
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create new playlist toggle or form */}
        <div className="p-5 border-t border-white/10 bg-black/20">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create new playlist</span>
            </button>
          ) : (
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Playlist Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI Masterclasses"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#161B26] border border-white/20 focus:border-[#818CF8] rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Privacy
                </label>
                <select
                  value={newVisibility}
                  onChange={(e) => setNewVisibility(e.target.value as any)}
                  className="w-full bg-[#161B26] border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="public">Public (Anyone can search and view)</option>
                  <option value="private">Private (Only you can view)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#818CF8] text-black hover:bg-[#818CF8]/90 disabled:opacity-50"
                >
                  Create & Save
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
