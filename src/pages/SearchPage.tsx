import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Filter, Film, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { Video, User } from '../types';
import { api } from '../lib/api';
import { VideoCard } from '../components/common/VideoCard';
import { SkeletonLoader } from '../components/common/SkeletonLoader';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [videos, setVideos] = useState<Video[]>([]);
  const [channels, setChannels] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters state
  const [sortBy, setSortBy] = useState<'relevance' | 'views' | 'date' | 'rating'>('relevance');
  const [durationFilter, setDurationFilter] = useState<'any' | 'short' | 'long'>('any');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'channel'>('all');

  const navigate = useNavigate();

  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true);
      try {
        const [vidsRes, chRes] = await Promise.all([
          api.get(`/videos?q=${encodeURIComponent(query)}`),
          api.get('/users/channels'),
        ]);

        let vids: Video[] = vidsRes.data;
        let chs: User[] = chRes.data.filter((c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.username.toLowerCase().includes(query.toLowerCase())
        );

        // Client-side filtering & sorting
        if (durationFilter === 'short') {
          vids = vids.filter((v) => v.duration < 240);
        } else if (durationFilter === 'long') {
          vids = vids.filter((v) => v.duration > 1200);
        }

        if (sortBy === 'views') {
          vids.sort((a, b) => b.views - a.views);
        } else if (sortBy === 'date') {
          vids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sortBy === 'rating') {
          vids.sort((a, b) => (b.likes / (b.likes + b.dislikes || 1)) - (a.likes / (a.likes + a.dislikes || 1)));
        }

        setVideos(vids);
        setChannels(chs);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();

    const handleVideoDeleted = (e: any) => {
      const deletedId = e.detail?.videoId;
      const baseId = e.detail?.baseId || deletedId;
      if (deletedId) {
        setVideos((prev) => prev.filter((v) => v._id !== deletedId && v._id !== baseId));
      }
    };
    window.addEventListener('video-deleted', handleVideoDeleted);
    return () => window.removeEventListener('video-deleted', handleVideoDeleted);
  }, [query, sortBy, durationFilter, typeFilter]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header & Filter Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-[#818CF8]" />
            <span>Search results for "{query || 'All'}"</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Found {videos.length} videos and {channels.length} channels
          </p>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all border ${
            showFilters
              ? 'bg-white text-black border-white'
              : 'bg-[#161B26] text-gray-200 hover:bg-[#1F2633] border-white/15'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Expandable Filter Panel */}
      {showFilters && (
        <div className="p-6 rounded-3xl bg-[#161B26] border border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-slide-up shadow-xl">
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sort by</h4>
            <div className="space-y-2">
              {[
                { label: 'Relevance', val: 'relevance' },
                { label: 'Upload Date', val: 'date' },
                { label: 'View Count', val: 'views' },
                { label: 'Rating', val: 'rating' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setSortBy(opt.val as any)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    sortBy === opt.val ? 'bg-[#818CF8] text-black font-bold' : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Duration</h4>
            <div className="space-y-2">
              {[
                { label: 'Any duration', val: 'any' },
                { label: 'Under 4 minutes (Short)', val: 'short' },
                { label: 'Over 20 minutes (Long)', val: 'long' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setDurationFilter(opt.val as any)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    durationFilter === opt.val ? 'bg-[#818CF8] text-black font-bold' : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Result Type</h4>
            <div className="space-y-2">
              {[
                { label: 'All Results', val: 'all' },
                { label: 'Videos Only', val: 'video' },
                { label: 'Channels Only', val: 'channel' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setTypeFilter(opt.val as any)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    typeFilter === opt.val ? 'bg-[#818CF8] text-black font-bold' : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader type="list" count={6} />
      ) : (
        <div className="space-y-8">
          {/* Channels Matches */}
          {(typeFilter === 'all' || typeFilter === 'channel') && channels.length > 0 && (
            <div className="space-y-4 pb-6 border-b border-white/10">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Matching Channels</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {channels.map((ch) => (
                  <div
                    key={ch._id}
                    onClick={() => navigate(`/channel/${ch._id}`)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-[#161B26] hover:bg-[#1F2633] cursor-pointer transition-all border border-white/10"
                  >
                    <img src={ch.avatar} alt={ch.name} className="w-16 h-16 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-base flex items-center gap-1.5 truncate">
                        <span>{ch.name}</span>
                        {ch.verified && <CheckCircle2 className="w-4 h-4 text-[#818CF8] fill-[#818CF8]/20" />}
                      </h4>
                      <p className="text-xs text-gray-400">@{ch.username} • {ch.subscribersCount > 0 ? (ch.subscribersCount >= 1000000 ? `${(ch.subscribersCount / 1000000).toFixed(2)}M` : ch.subscribersCount >= 1000 ? `${(ch.subscribersCount / 1000).toFixed(1)}K` : ch.subscribersCount) : 0} subs</p>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-1">{ch.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Matches */}
          {(typeFilter === 'all' || typeFilter === 'video') && (
            <div className="space-y-4">
              {videos.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-3">
                  <Film className="w-12 h-12 text-gray-500 mx-auto" />
                  <p className="text-lg font-bold text-white">No matching videos found</p>
                  <p className="text-xs">Try different keywords or clearing your filters.</p>
                </div>
              ) : (
                videos.map((vid) => (
                  <VideoCard key={vid._id} video={vid} layout="list" />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
