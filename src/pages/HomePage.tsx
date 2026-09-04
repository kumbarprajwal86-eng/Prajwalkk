import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Flame, Sparkles, TrendingUp, RefreshCw, ArrowRight, Play, Film } from 'lucide-react';
import { Video, VideoCategory } from '../types';
import { api } from '../lib/api';
import { VideoCard } from '../components/common/VideoCard';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { PlaylistModal } from '../components/common/PlaylistModal';
import { ShareModal } from '../components/common/ShareModal';

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = (searchParams.get('category') as VideoCategory) || 'All';
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [trending, setTrending] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideoForPlaylist, setSelectedVideoForPlaylist] = useState<Video | null>(null);
  const [selectedVideoForShare, setSelectedVideoForShare] = useState<Video | null>(null);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const navigate = useNavigate();

  const categories: VideoCategory[] = [
    'All',
    'Trending',
    'Gaming',
    'Music',
    'Technology',
    'Education',
    'Sports',
    'News',
    'Fashion',
    'Movies',
    'Shorts',
  ];

  const fetchContent = async (cat: string) => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get(`/videos?category=${cat === 'All' || cat === 'Trending' ? '' : cat}&isShort=false`),
        api.get('/videos/shorts'),
        api.get('/videos/trending'),
      ]);
      if (results[0].status === 'fulfilled') setVideos(results[0].value.data || []);
      if (results[1].status === 'fulfilled') setShorts(results[1].value.data || []);
      if (results[2].status === 'fulfilled') setTrending(results[2].value.data || []);
    } catch (err) {
      console.error('Failed to load videos', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent(activeCategory);

    const handleVideoDeleted = (e: any) => {
      const deletedId = e.detail?.videoId;
      if (deletedId) {
        setVideos((prev) => prev.filter((v) => v._id !== deletedId));
        setShorts((prev) => prev.filter((s) => s._id !== deletedId));
        setTrending((prev) => prev.filter((t) => t._id !== deletedId));
      }
    };
    window.addEventListener('video-deleted', handleVideoDeleted);
    return () => window.removeEventListener('video-deleted', handleVideoDeleted);
  }, [activeCategory]);

  const handleCategoryChange = (cat: VideoCategory) => {
    if (cat === 'Shorts') {
      navigate('/shorts');
      return;
    }
    if (cat === 'All') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: cat });
    }
  };

  const loadMoreVideos = () => {
    // No fake video duplication
    setIsFetchingMore(false);
  };

  return (
    <div className="pb-8 px-4 sm:px-6 pt-0 max-w-[1800px] mx-auto space-y-4 sm:space-y-6">
      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none sticky top-14 z-20 bg-[#0D1117]/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-white/10 transition-colors">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-black shadow-md font-bold'
                  : 'bg-[#161B26] hover:bg-[#1F2633] text-gray-300 hover:text-white border border-white/10'
              }`}
            >
              {cat === 'Trending' && <Flame className={`w-3.5 h-3.5 ${isActive ? 'fill-black' : 'text-[#FF4D6D]'}`} />}
              {cat === 'Shorts' && <span className="text-[#FF4D6D] font-black">⚡</span>}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Hero Banner for AI Recommendation / Special Feature */}
      {activeCategory === 'All' && !isLoading && videos.length > 0 && (
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#161B26] via-[#1F2633] to-[#10141D] border border-white/15 p-6 sm:p-10 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 group">
          <div className="space-y-4 max-w-xl">

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              {videos[0].title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed">
              {videos[0].description}
            </p>
            <div className="pt-2">
            </div>
          </div>

          <div
            onClick={() => navigate(`/watch/${videos[0]._id}`)}
            className="relative w-full lg:w-96 aspect-video rounded-2xl overflow-hidden shadow-2xl cursor-pointer group-hover:scale-[1.02] transition-transform flex-shrink-0"
          >
            <img src={videos[0].thumbnailUrl} alt={videos[0].title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[#FF4D6D] flex items-center justify-center text-white shadow-xl">
                <Play className="w-7 h-7 fill-white ml-0.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shorts Shelf Carousel */}
      {shorts.length > 0 && activeCategory === 'All' && (
        <div className="space-y-4 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <h2 className="text-xl font-bold text-white tracking-tight">VIEWPOINT Shorts</h2>
            </div>
            <button
              onClick={() => navigate('/shorts')}
              className="text-xs font-bold text-[#818CF8] hover:underline flex items-center gap-1"
            >
              <span>View All Shorts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {shorts.slice(0, 6).map((short) => (
              <div
                key={short._id}
                onClick={() => navigate('/shorts')}
                className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-900 cursor-pointer group shadow-lg transition-transform hover:-translate-y-1"
              >
                <img src={short.thumbnailUrl} alt={short.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3 flex flex-col justify-end">
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">{short.title}</h4>
                  <p className="text-[10px] text-gray-300 mt-1">{short.views ? (short.views >= 1000 ? `${(short.views / 1000).toFixed(1)}K` : short.views) : '0'} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Video Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {activeCategory === 'Trending' ? (
              <>
                <Flame className="w-5 h-5 text-[#FF4D6D] fill-[#FF4D6D]" />
                <span>Trending Videos</span>
              </>
            ) : activeCategory === 'All' ? (
              <>
                <Sparkles className="w-5 h-5 text-[#818CF8]" />
                <span>Recommended For You</span>
              </>
            ) : (
              <span>{activeCategory} Videos</span>
            )}
          </h2>
          <span className="text-xs text-gray-400">{videos.length} videos</span>
        </div>

        {isLoading ? (
          <SkeletonLoader type="grid" count={8} />
        ) : videos.length === 0 ? (
          <div className="text-center py-20 bg-[#161B26]/40 rounded-3xl border border-white/10 space-y-4">
            <Film className="w-12 h-12 text-gray-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">No videos found in this category</h3>
            <p className="text-xs text-gray-400">Try exploring other channels or uploading a new video.</p>
            <button
              onClick={() => handleCategoryChange('All')}
              className="px-6 py-2 bg-[#FF4D6D] text-white rounded-full text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
            {videos.map((video) => (
              <VideoCard
                key={video._id}
                video={video}
                onDelete={(deletedId) => setVideos((prev) => prev.filter((v) => v._id !== deletedId))}
                onOpenPlaylistModal={(v) => setSelectedVideoForPlaylist(v)}
                onOpenShareModal={(v) => setSelectedVideoForShare(v)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Infinite Scroll / Load More */}
      {!isLoading && videos.length > 0 && (
        <div className="pt-8 text-center">
          <button
            onClick={loadMoreVideos}
            disabled={isFetchingMore}
            className="px-8 py-3 bg-[#161B26] hover:bg-[#1F2633] text-white rounded-full text-xs font-bold border border-white/15 transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {isFetchingMore ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#818CF8]" />
                <span>Loading more streams...</span>
              </>
            ) : (
              <>
                <span>Load More Videos</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Modals */}
      <PlaylistModal
        video={selectedVideoForPlaylist}
        onClose={() => setSelectedVideoForPlaylist(null)}
      />
      <ShareModal
        video={selectedVideoForShare}
        onClose={() => setSelectedVideoForShare(null)}
      />
    </div>
  );
};
