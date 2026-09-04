import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  Music,
  CheckCircle2,
  Plus,
  Check,
  MoreVertical,
  Trash2,
  Download
} from 'lucide-react';
import { Video } from '../types';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { getWorkingVideoUrl, getFallbackVideoUrl, getEmbedInfo, isUserVideoUploader, downloadVideoFile } from '../utils/videoUtils';
import { CommentSection } from '../components/common/CommentSection';
import { ShareModal } from '../components/common/ShareModal';

export const ShortsPage: React.FC = () => {
  const [shorts, setShorts] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [errorAttempts, setErrorAttempts] = useState<Record<number, number>>({});
  const [customUrls, setCustomUrls] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [dislikedMap, setDislikedMap] = useState<Record<string, boolean>>({});
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const { user, toggleSubscribe } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShorts = async () => {
      try {
        const res = await api.get('/videos/shorts');
        const list: Video[] = res.data;
        setShorts(list);

        if (user) {
          const lMap: Record<string, boolean> = {};
          const dMap: Record<string, boolean> = {};
          list.forEach((v) => {
            lMap[v._id] = user.likedVideos.includes(v._id);
            dMap[v._id] = user.dislikedVideos.includes(v._id);
          });
          setLikedMap(lMap);
          setDislikedMap(dMap);
        }
      } catch (err) {
        console.error('Failed to load shorts', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShorts();
  }, [user?._id]);

  // Sync play state with currentIndex
  useEffect(() => {
    videoRefs.current.forEach((vid, idx) => {
      if (!vid) return;
      if (idx === currentIndex) {
        vid.currentTime = 0;
        vid.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      } else {
        vid.pause();
      }
    });
  }, [currentIndex, shorts.length]);

  // Keyboard navigation Up / Down
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm') {
        e.preventDefault();
        setIsMuted((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, shorts.length, isPlaying]);

  const handleNext = () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowComments(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowComments(false);
    }
  };

  const togglePlay = () => {
    const currentVid = videoRefs.current[currentIndex];
    if (currentVid) {
      if (isPlaying) {
        currentVid.pause();
        setIsPlaying(false);
      } else {
        currentVid.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  };

  const handleLike = async (short: Video) => {
    if (!user) {
      alert('Please sign in to like videos.');
      return;
    }
    try {
      await api.post(`/videos/${short._id}/like`);
      setLikedMap((prev) => ({ ...prev, [short._id]: !prev[short._id] }));
      if (dislikedMap[short._id]) {
        setDislikedMap((prev) => ({ ...prev, [short._id]: false }));
      }
    } catch (e) {}
  };

  const handleDislike = async (short: Video) => {
    if (!user) {
      alert('Please sign in to dislike videos.');
      return;
    }
    try {
      await api.post(`/videos/${short._id}/dislike`);
      setDislikedMap((prev) => ({ ...prev, [short._id]: !prev[short._id] }));
      if (likedMap[short._id]) {
        setLikedMap((prev) => ({ ...prev, [short._id]: false }));
      }
    } catch (e) {}
  };

  const handleDownloadShort = async (short: Video) => {
    if (!short || isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(10);
    try {
      await downloadVideoFile(short, (p) => setDownloadProgress(p));
    } catch (err) {
      console.error('Download short failed:', err);
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1200);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center">
        <div className="w-80 h-[550px] bg-[#161B26] rounded-3xl animate-pulse shadow-2xl" />
      </div>
    );
  }

  if (shorts.length === 0) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-lg font-bold text-white mb-2">No Shorts Available Yet</p>
        <p className="text-sm">Be the first creator to upload vertical shorts!</p>
        <button
          onClick={() => navigate('/upload')}
          className="mt-4 px-6 py-2.5 bg-[#FF4D6D] text-white font-bold rounded-full text-xs"
        >
          Upload Short
        </button>
      </div>
    );
  }

  const currentShort = shorts[currentIndex];
  const creatorId = typeof currentShort.creator === 'object' ? (currentShort.creator._id || (currentShort.creator as any).id) : currentShort.creator;
  const isSubscribed = user?.subscribedTo.includes(creatorId);
  const isUploader = isUserVideoUploader(user, currentShort);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    setTouchStartY(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col md:flex-row items-center justify-center p-4 bg-[#0D1117] select-none overflow-hidden">
      {/* Up / Down Navigation Controls Desktop */}
      <div className="hidden md:flex flex-col gap-4 absolute right-12 z-20">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="w-12 h-12 rounded-full bg-[#161B26] hover:bg-[#1F2633] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white border border-white/10 shadow-xl transition-transform hover:scale-110"
          title="Previous Short (Up arrow)"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === shorts.length - 1}
          className="w-12 h-12 rounded-full bg-[#161B26] hover:bg-[#1F2633] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white border border-white/10 shadow-xl transition-transform hover:scale-110"
          title="Next Short (Down arrow)"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Main Shorts Card Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-end"
      >
        {/* Video Player or Embed Iframe */}
        {getEmbedInfo(customUrls[currentIndex] || currentShort.videoUrl).isEmbed ? (
          <iframe
            src={getEmbedInfo(customUrls[currentIndex] || currentShort.videoUrl).embedUrl}
            title={currentShort.title}
            className="absolute inset-0 w-full h-full border-0 object-cover bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            ref={(el) => {
              videoRefs.current[currentIndex] = el;
            }}
            src={customUrls[currentIndex] || getWorkingVideoUrl(currentShort.videoUrl)}
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            onClick={togglePlay}
            onError={() => {
              const attempt = errorAttempts[currentIndex] || 0;
              if (attempt < 5) {
                const currentUrl = customUrls[currentIndex] || getWorkingVideoUrl(currentShort.videoUrl);
                const nextUrl = getFallbackVideoUrl(currentUrl, attempt);
                setCustomUrls(prev => ({ ...prev, [currentIndex]: nextUrl }));
                setErrorAttempts(prev => ({ ...prev, [currentIndex]: attempt + 1 }));
              }
            }}
            className="absolute inset-0 w-full h-full object-cover cursor-pointer"
          />
        )}

        {/* Play/Pause center overlay when paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white z-10 transition-transform hover:scale-110"
          >
            <Play className="w-10 h-10 fill-white ml-1" />
          </button>
        )}

        {/* Top Sound Toggle & Index Indicator */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20">
          <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white tracking-wider border border-white/10">
            {currentIndex + 1} / {shorts.length}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/10 transition-transform hover:scale-105"
            aria-label="Toggle mute"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Right Side Action Icons */}
        <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5">
          {/* Like */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => handleLike(currentShort)}
              className={`w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 ${
                likedMap[currentShort._id] ? 'text-[#818CF8] bg-[#818CF8]/20 border border-[#818CF8]' : 'text-white'
              }`}
            >
              <ThumbsUp className={`w-6 h-6 ${likedMap[currentShort._id] ? 'fill-[#818CF8]' : ''}`} />
            </button>
            <span className="text-xs font-bold text-white drop-shadow">
              {(currentShort.likes + (likedMap[currentShort._id] ? 1 : 0)) >= 1000
                ? `${((currentShort.likes + (likedMap[currentShort._id] ? 1 : 0)) / 1000).toFixed(1)}K`
                : currentShort.likes + (likedMap[currentShort._id] ? 1 : 0)}
            </span>
          </div>

          {/* Dislike */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => handleDislike(currentShort)}
              className={`w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 ${
                dislikedMap[currentShort._id] ? 'text-[#FF4D6D] bg-[#FF4D6D]/20 border border-[#FF4D6D]' : 'text-white'
              }`}
            >
              <ThumbsDown className={`w-6 h-6 ${dislikedMap[currentShort._id] ? 'fill-[#FF4D6D]' : ''}`} />
            </button>
            <span className="text-xs font-bold text-white drop-shadow">Dislike</span>
          </div>

          {/* Comments */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setShowComments(!showComments)}
              className={`w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 ${
                showComments ? 'bg-white text-black' : 'text-white'
              }`}
            >
              <MessageSquare className="w-6 h-6" />
            </button>
            <span className="text-xs font-bold text-white drop-shadow">Comment</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => setShowShareModal(true)}
              className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-110"
            >
              <Share2 className="w-6 h-6" />
            </button>
            <span className="text-xs font-bold text-white drop-shadow">Share</span>
          </div>

          {/* Download */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => handleDownloadShort(currentShort)}
              disabled={isDownloading}
              className={`w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-110 ${
                isDownloading ? 'bg-[#00C853]/40 border border-[#00C853]' : ''
              }`}
              title="Download short video"
            >
              <Download className={`w-6 h-6 ${isDownloading ? 'animate-bounce text-[#00C853]' : ''}`} />
            </button>
            <span className="text-xs font-bold text-white drop-shadow">
              {isDownloading ? `${downloadProgress}%` : 'Save'}
            </span>
          </div>

          {/* Delete Short (Uploader Only) */}
          {isUploader && (
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete this short "${currentShort.title}"?`)) {
                    try {
                      const baseId = currentShort._id.split('-more-')[0];
                      await api.delete(`/videos/${baseId}`);
                      window.dispatchEvent(new CustomEvent('video-deleted', { detail: { videoId: currentShort._id, baseId } }));
                      setShorts((prev) => prev.filter((s) => s._id !== currentShort._id && s._id !== baseId));
                      if (currentIndex >= shorts.length - 1) {
                        setCurrentIndex(Math.max(0, shorts.length - 2));
                      }
                      alert('Short deleted successfully.');
                    } catch (err: any) {
                      alert(err.response?.data?.error || 'Failed to delete short.');
                    }
                  }
                }}
                className="w-12 h-12 rounded-full bg-red-600/80 hover:bg-red-600 backdrop-blur-md flex items-center justify-center text-white transition-all hover:scale-110 shadow-lg border border-red-400/40 cursor-pointer"
                title="Delete this short (Uploader only)"
              >
                <Trash2 className="w-5 h-5 text-white" />
              </button>
              <span className="text-xs font-bold text-red-400 drop-shadow">Delete</span>
            </div>
          )}

          {/* More actions */}
          <button className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Video Info & Creator Profile */}
        <div className="relative z-10 p-5 bg-gradient-to-t from-black via-black/60 to-transparent pr-16 space-y-3">
          {/* Creator row */}
          <div className="flex items-center gap-3">
            <img
              src={currentShort.channelAvatar}
              alt={currentShort.channelName}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/channel/${creatorId}`);
              }}
              className="w-10 h-10 rounded-full object-cover border-2 border-white cursor-pointer hover:scale-105 transition-transform"
            />
            <div
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/channel/${creatorId}`);
              }}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-white drop-shadow">{currentShort.channelName}</span>
                {currentShort.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[#818CF8] fill-[#818CF8]/20" />}
              </div>
            </div>

            {user?._id !== creatorId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSubscribe(creatorId);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                  isSubscribed ? 'bg-white/20 text-white' : 'bg-[#FF4D6D] text-white shadow-lg shadow-[#FF4D6D]/30'
                }`}
              >
                {isSubscribed ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                <span>{isSubscribed ? 'Subscribed' : 'Subscribe'}</span>
              </button>
            )}
          </div>

          {/* Title & description */}
          <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug drop-shadow">
            {currentShort.title}
          </h3>

          {/* Audio track ticker */}
          <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
            <Music className="w-3.5 h-3.5 text-white animate-spin" style={{ animationDuration: '4s' }} />
            <span className="truncate">Original Sound - {currentShort.channelName}</span>
          </div>
        </div>

        {/* Mobile bottom navigation arrows */}
        <div className="flex md:hidden justify-between p-3 bg-black/90 border-t border-white/10 z-20">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-4 py-1.5 bg-white/10 rounded-xl text-xs font-bold text-white disabled:opacity-30"
          >
            <ChevronUp className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === shorts.length - 1}
            className="flex items-center gap-1 px-4 py-1.5 bg-[#FF4D6D] rounded-xl text-xs font-bold text-white disabled:opacity-30"
          >
            <span>Next Short</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide-out Comments Panel */}
      {showComments && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#161B26] border-l border-white/15 shadow-2xl p-6 overflow-y-auto animate-slide-left flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-2">
            <h3 className="text-lg font-bold text-white">Shorts Comments</h3>
            <button onClick={() => setShowComments(false)} className="p-1 text-gray-400 hover:text-white rounded-full">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            <CommentSection videoId={currentShort._id} videoCreatorId={creatorId} />
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          video={currentShort}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};
