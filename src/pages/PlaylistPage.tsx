import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListVideo, Play, Trash2, Lock, Globe, Plus, Video as VideoIcon } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { Playlist, Video } from '../types';
import { VideoCard } from '../components/common/VideoCard';

export const PlaylistPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVisibility, setNewVisibility] = useState<'public' | 'private'>('public');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchPlaylists = async () => {
      try {
        const res = await api.get(`/playlists?userId=${user._id}`);
        const list: Playlist[] = res.data;
        setPlaylists(list);
        if (list.length > 0 && !selectedPlaylist) {
          setSelectedPlaylist(list[0]);
        }
      } catch (err) {
        console.error('Failed to load playlists', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlaylists();
  }, [user?._id]);

  if (!user) return null;

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await api.post('/playlists', {
        title: newTitle.trim(),
        visibility: newVisibility,
      });
      const newPl = res.data;
      setPlaylists([newPl, ...playlists]);
      setSelectedPlaylist(newPl);
      setNewTitle('');
      setShowCreate(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create playlist.');
    }
  };

  const handleDeletePlaylist = async (plId: string) => {
    if (!window.confirm('Delete this playlist?')) return;
    try {
      await api.delete(`/playlists/${plId}`);
      const rem = playlists.filter((p) => p._id !== plId);
      setPlaylists(rem);
      if (selectedPlaylist?._id === plId) {
        setSelectedPlaylist(rem[0] || null);
      }
    } catch (err) {
      alert('Failed to delete playlist.');
    }
  };

  const handleRemoveVideoFromPlaylist = async (videoId: string) => {
    if (!selectedPlaylist) return;
    try {
      await api.post(`/playlists/${selectedPlaylist._id}/videos`, { videoId });
      const updatedVideos = selectedPlaylist.videos.filter((v) => v._id !== videoId);
      const updatedPl = { ...selectedPlaylist, videos: updatedVideos };
      setSelectedPlaylist(updatedPl);
      setPlaylists((prev) => prev.map((p) => (p._id === updatedPl._id ? updatedPl : p)));
    } catch (err) {
      alert('Failed to update playlist.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <ListVideo className="w-7 h-7 text-[#818CF8]" />
            <span>My Saved Playlists</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Organize and curate custom collections of your favorite masterclasses and live streams.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-5 py-2.5 bg-[#818CF8] hover:bg-[#818CF8]/90 text-black font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Create Modal Form */}
      {showCreate && (
        <form onSubmit={handleCreatePlaylist} className="p-6 rounded-3xl bg-[#161B26] border border-white/15 space-y-4 max-w-lg shadow-2xl animate-slide-up">
          <h3 className="text-base font-bold text-white">New Playlist Collection</h3>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Title</label>
            <input
              type="text"
              placeholder="e.g. AI Engineering Top Picks"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Privacy</label>
            <select
              value={newVisibility}
              onChange={(e) => setNewVisibility(e.target.value as any)}
              className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="public">🌐 Public</option>
              <option value="private">🔒 Private</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[#818CF8] text-black">Save Playlist</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-20 text-gray-400 animate-pulse">Loading playlist collections...</div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-20 bg-[#161B26]/40 rounded-3xl border border-white/10 space-y-4">
          <ListVideo className="w-16 h-16 text-gray-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">No custom playlists created yet</h3>
          <p className="text-xs text-gray-400">Click the button above to create your first collection.</p>
          <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 bg-[#818CF8] text-black font-bold rounded-full text-xs">
            Create Playlist Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar List of Playlists */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Collections ({playlists.length})</h4>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {playlists.map((pl) => {
                const isSel = selectedPlaylist?._id === pl._id;
                return (
                  <div
                    key={pl._id}
                    onClick={() => setSelectedPlaylist(pl)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border flex items-center justify-between group ${
                      isSel ? 'bg-white/15 border-white text-white shadow-xl font-bold' : 'bg-[#161B26] hover:bg-[#1F2633] border-white/5 text-gray-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-sm font-bold truncate">{pl.title}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        {pl.visibility === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        <span>{pl.videos.length} videos</span>
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlaylist(pl._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-[#FF4D6D] transition-opacity"
                      title="Delete playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Area: Selected Playlist Videos */}
          <div className="lg:col-span-3 space-y-6">
            {selectedPlaylist && (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-[#161B26] to-[#10141D] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#818CF8] uppercase tracking-wider mb-1">
                    {selectedPlaylist.visibility === 'private' ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                    <span className="capitalize">{selectedPlaylist.visibility} Collection</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{selectedPlaylist.title}</h2>
                  <p className="text-xs text-gray-400 mt-1">{selectedPlaylist.videos.length} videos in collection</p>
                </div>

                {selectedPlaylist.videos.length > 0 && (
                  <button
                    onClick={() => navigate(`/watch/${selectedPlaylist.videos[0]._id}`)}
                    className="px-8 py-3.5 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white font-bold rounded-2xl shadow-lg shadow-[#FF4D6D]/30 flex items-center gap-2.5 text-sm transition-transform hover:scale-105 self-start sm:self-auto"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>Play All</span>
                  </button>
                )}
              </div>
            )}

            {selectedPlaylist && selectedPlaylist.videos.length === 0 ? (
              <div className="text-center py-20 bg-[#161B26]/30 rounded-3xl border border-white/5 space-y-3">
                <VideoIcon className="w-12 h-12 text-gray-500 mx-auto" />
                <h3 className="text-lg font-bold text-white">No videos in "{selectedPlaylist.title}"</h3>
                <p className="text-xs text-gray-400">Add videos to this playlist by clicking "Save" on any video card or watch page.</p>
                <button onClick={() => navigate('/home')} className="px-6 py-2 bg-white/10 text-white rounded-full text-xs font-bold">
                  Explore Videos
                </button>
              </div>
            ) : (
              selectedPlaylist && (
                <div className="space-y-4">
                  {selectedPlaylist.videos.map((vid, idx) => (
                    <div key={vid._id} className="relative group">
                      <VideoCard video={vid} layout="list" />
                      <button
                        onClick={() => handleRemoveVideoFromPlaylist(vid._id)}
                        className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-black/80 hover:bg-[#FF4D6D] text-white rounded-xl text-xs font-bold transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 shadow-lg"
                        title="Remove from playlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
