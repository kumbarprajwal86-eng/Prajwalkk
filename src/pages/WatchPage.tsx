import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  ListPlus,
  CheckCircle2,
  Bell,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Flame,
  Check,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Video } from '../types';
import { api } from '../lib/api';
import { VideoPlayer } from '../components/common/VideoPlayer';
import { VideoCard } from '../components/common/VideoCard';
import { CommentSection } from '../components/common/CommentSection';
import { PlaylistModal } from '../components/common/PlaylistModal';
import { ShareModal } from '../components/common/ShareModal';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { isUserVideoUploader, downloadVideoFile } from '../utils/videoUtils';

export const WatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const startTime = parseInt(searchParams.get('t') || '0', 10);
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [aiReason, setAiReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const { user, toggleSubscribe, openAuthPrompt } = useAuthStore();
  const { theaterMode, historyPaused } = useThemeStore();
  const { nextInQueue } = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const fetchVideoData = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/videos/${id}`);
        const vid: Video = res.data;
        setVideo(vid);
        setLikesCount(vid.likes);
        setDislikesCount(vid.dislikes);

        if (user) {
          setIsLiked(user.likedVideos.includes(vid._id));
          setIsDisliked(user.dislikedVideos.includes(vid._id));
          const creatorId = typeof vid.creator === 'object' ? vid.creator._id : vid.creator;
          setIsSubscribed(user.subscribedTo.includes(creatorId));
        }

        // Fetch channel info for sub count
        const creatorId = typeof vid.creator === 'object' ? vid.creator._id : vid.creator;
        try {
          const chRes = await api.get(`/users/${creatorId}`);
          if (chRes.data?.user) {
            setSubscribersCount(chRes.data.user.subscribersCount);
          }
        } catch (e) {
          setSubscribersCount(0);
        }

        // Record view if history is not paused
        if (!historyPaused) {
          api.post(`/videos/${id}/view`, { progress: 0 }).catch(() => {});
        }

        // Fetch recommendations
        const recRes = await api.post('/ai/recommendations', { videoId: id });
        setRelatedVideos(recRes.data.recommendations || []);
        setAiReason(recRes.data.aiReason || 'Algorithmic topic match');
      } catch (err) {
        console.error('Failed to load video details', err);
      } finally {
        setIsLoading(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    fetchVideoData();

    const handleVideoDeleted = (e: any) => {
      const deletedId = e.detail?.videoId;
      if (deletedId) {
        setRelatedVideos((prev) => prev.filter((v) => v._id !== deletedId));
      }
    };
    window.addEventListener('video-deleted', handleVideoDeleted);
    return () => window.removeEventListener('video-deleted', handleVideoDeleted);
  }, [id, user?._id]);

  if (isLoading) {
    return <SkeletonLoader type="watch" />;
  }

  if (!video) {
    return (
      <div className="text-center py-24 px-4 space-y-4">
        <h2 className="text-2xl font-bold text-white">Video unavailable or deleted</h2>
        <p className="text-sm text-gray-400">The video you are looking for does not exist or has been made private.</p>
        <button
          onClick={() => navigate('/home')}
          className="px-6 py-2.5 bg-[#FF4D6D] text-white rounded-full text-sm font-bold"
        >
          Return Home
        </button>
      </div>
    );
  }

  const creatorId = typeof video.creator === 'object' ? (video.creator._id || (video.creator as any).id) : video.creator;
  const isUploader = isUserVideoUploader(user, video);

  const handleLike = async () => {
    if (!user) {
      openAuthPrompt('Want to like this video? Sign in to make your opinion count.');
      return;
    }
    try {
      const res = await api.post(`/videos/${video._id}/like`);
      setIsLiked(!isLiked);
      if (isDisliked) setIsDisliked(false);
      setLikesCount(res.data.video.likes);
      setDislikesCount(res.data.video.dislikes);
    } catch (e) {
      // ignore
    }
  };

  const handleDislike = async () => {
    if (!user) {
      openAuthPrompt("Don't like this video? Sign in to make your opinion count.");
      return;
    }
    try {
      const res = await api.post(`/videos/${video._id}/dislike`);
      setIsDisliked(!isDisliked);
      if (isLiked) setIsLiked(false);
      setLikesCount(res.data.video.likes);
      setDislikesCount(res.data.video.dislikes);
    } catch (e) {
      // ignore
    }
  };

  const handleSubscribeClick = async () => {
    if (!user) {
      openAuthPrompt('Want to subscribe to this channel? Sign in to get notified about new uploads.');
      return;
    }
    const nextSubState = await toggleSubscribe(creatorId);
    setIsSubscribed(nextSubState);
    setSubscribersCount((prev) => (nextSubState ? prev + 1 : Math.max(0, prev - 1)));
  };

  const handleDownload = async () => {
    if (!video || isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(10);
    try {
      await downloadVideoFile(video, (p) => setDownloadProgress(p));
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1200);
    }
  };

  const handleRepublish = async () => {
    if (!video) return;
    try {
      const baseId = video._id.split('-more-')[0];
      await api.post(`/videos/${baseId}/republish`);
      alert(`"${video.title}" has been successfully republished to the top of the feed!`);
      // Reload current video data
      const res = await api.get(`/videos/${baseId}`);
      if (res.data) setVideo(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to republish video.');
    }
  };

  const handleVideoEnded = () => {
    const nextVid = nextInQueue() || relatedVideos[0];
    if (nextVid) {
      navigate(`/watch/${nextVid._id}`);
    }
  };

  const handleProgressSave = (progress: number) => {
    if (user && progress % 20 === 0 && !historyPaused) {
      api.post(`/videos/${video._id}/view`, { progress }).catch(() => {});
    }
  };

  const formatViews = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={`mx-auto px-2 sm:px-6 py-2 sm:py-6 ${theaterMode ? 'max-w-[1800px]' : 'max-w-7xl'}`}>
      <div className={`grid grid-cols-1 ${theaterMode ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8`}>
        {/* Main Video Section */}
        <div className={theaterMode ? 'w-full' : 'lg:col-span-2'}>
          {/* Video Player Wrapper */}
          <VideoPlayer
            video={video}
            startTime={startTime}
            onEnded={handleVideoEnded}
            onProgress={handleProgressSave}
          />

          {/* Title & Stats */}
          <div className="mt-4 space-y-3">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-snug">
              {video.title}
            </h1>

            {/* Creator & Actions Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
              {/* Creator info */}
              <div className="flex items-center gap-3">
                <Link to={`/channel/${creatorId}`}>
                  <img
                    src={video.channelAvatar}
                    alt={video.channelName}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-transparent hover:ring-[#FF4D6D] transition-all"
                  />
                </Link>
                <div>
                  <Link
                    to={`/channel/${creatorId}`}
                    className="font-bold text-sm sm:text-base text-white hover:text-[#818CF8] transition-colors flex items-center gap-1"
                  >
                    <span>{video.channelName}</span>
                    {video.verified && <CheckCircle2 className="w-4 h-4 text-gray-400 fill-gray-400/20" />}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {subscribersCount > 0 ? (subscribersCount >= 1000000 ? `${(subscribersCount / 1000000).toFixed(2)}M` : subscribersCount >= 1000 ? `${(subscribersCount / 1000).toFixed(1)}K` : subscribersCount) : 0} subscribers
                  </p>
                </div>

                {/* Subscribe Button */}
                {user?._id !== creatorId && (
                  <button
                    onClick={handleSubscribeClick}
                    className={`ml-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                      isSubscribed
                        ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        : 'bg-[#FF4D6D] text-white hover:bg-[#FF4D6D]/90 shadow-lg shadow-[#FF4D6D]/30 hover:scale-105'
                    }`}
                  >
                    {isSubscribed ? (
                      <>
                        <Bell className="w-4 h-4 fill-white" />
                        <span>Subscribed</span>
                      </>
                    ) : (
                      <span>Subscribe</span>
                    )}
                  </button>
                )}
              </div>

              {/* Action Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {/* Like / Dislike pill */}
                <div className="flex items-center bg-[#161B26] rounded-full border border-white/10 overflow-hidden">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold hover:bg-white/10 transition-colors border-r border-white/10 ${
                      isLiked ? 'text-[#818CF8]' : 'text-gray-200'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-[#818CF8]' : ''}`} />
                    <span>{likesCount}</span>
                  </button>
                  <button
                    onClick={handleDislike}
                    className={`px-3 py-2 text-xs sm:text-sm hover:bg-white/10 transition-colors ${
                      isDisliked ? 'text-[#FF4D6D]' : 'text-gray-200'
                    }`}
                    title="Dislike"
                  >
                    <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-[#FF4D6D]' : ''}`} />
                  </button>
                </div>

                {/* Share */}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#161B26] hover:bg-[#1F2633] border border-white/10 rounded-full text-xs sm:text-sm font-bold text-gray-200 transition-colors whitespace-nowrap"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>

                {/* Republish */}
                <button
                  onClick={handleRepublish}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-full text-xs sm:text-sm font-bold text-indigo-200 hover:text-white transition-colors whitespace-nowrap"
                  title="Republish video to top of feed"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Republish</span>
                </button>

                {/* Download */}
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2 bg-[#161B26] hover:bg-[#1F2633] border border-white/10 rounded-full text-xs sm:text-sm font-bold text-gray-200 transition-colors whitespace-nowrap cursor-pointer"
                  title="Download video to your device"
                >
                  <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce text-[#00C853]' : ''}`} />
                  <span>{isDownloading ? `${downloadProgress}%` : 'Download'}</span>
                </button>

                {/* Save to Playlist */}
                <button
                  onClick={() => {
                    if (!user) {
                      openAuthPrompt('Want to save this video to a playlist? Sign in to organize your favorites.');
                    } else {
                      setShowPlaylistModal(true);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#161B26] hover:bg-[#1F2633] border border-white/10 rounded-full text-xs sm:text-sm font-bold text-gray-200 transition-colors whitespace-nowrap"
                >
                  <ListPlus className="w-4 h-4" />
                  <span>Save</span>
                </button>

                {/* Delete video button */}
                <button
                  onClick={async () => {
                    if (window.confirm(`Are you sure you want to delete "${video.title}"? This will permanently delete the video.`)) {
                      try {
                        const baseId = video._id.split('-more-')[0];
                        await api.delete(`/videos/${baseId}`);
                        window.dispatchEvent(new CustomEvent('video-deleted', { detail: { videoId: video._id, baseId } }));
                        alert('Video deleted successfully.');
                        navigate('/home');
                      } catch (err: any) {
                        alert(err.response?.data?.error || 'Failed to delete video.');
                      }
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 border border-[#FF4D6D]/30 rounded-full text-xs sm:text-sm font-bold text-[#FF4D6D] transition-colors whitespace-nowrap cursor-pointer"
                  title="Delete this video"
                >
                  <Trash2 className="w-4 h-4 text-[#FF4D6D]" />
                  <span>Delete Video</span>
                </button>
              </div>
            </div>
          </div>

          {/* Expandable Description Box */}
          <div
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="mt-4 p-4 rounded-2xl bg-[#161B26]/70 hover:bg-[#161B26] border border-white/10 cursor-pointer transition-colors space-y-2 text-sm text-gray-300"
          >
            <div className="flex items-center justify-between font-bold text-white text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <span>{formatViews(video.views)} views</span>
                <span>•</span>
                <span>Published on {new Date(video.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <span className="px-2 py-0.5 bg-white/10 rounded-md text-[11px] text-[#818CF8]">#{video.category}</span>
              </div>
              <button className="text-gray-400 hover:text-white">
                {isDescriptionExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            <div className={`whitespace-pre-wrap leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
              {video.description}
            </div>

            {/* Chapters if any */}
            {video.chapters && video.chapters.length > 0 && isDescriptionExpanded && (
              <div className="pt-4 border-t border-white/10 space-y-2" onClick={(e) => e.stopPropagation()}>
                <p className="font-bold text-white text-xs uppercase tracking-wider">Video Chapters</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {video.chapters.map((chap, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const videoEl = document.querySelector('video');
                        if (videoEl) {
                          videoEl.currentTime = chap.time;
                          videoEl.play().catch(() => {});
                        }
                      }}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 text-left text-xs transition-colors"
                    >
                      <span className="font-semibold text-gray-200 truncate">{chap.title}</span>
                      <span className="text-[#818CF8] font-mono font-bold ml-2">
                        {Math.floor(chap.time / 60)}:{(chap.time % 60) < 10 ? '0' : ''}{chap.time % 60}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {video.tags.map((tag) => (
                <span key={tag} className="text-xs text-[#818CF8] hover:underline">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <CommentSection videoId={video._id} videoCreatorId={creatorId} />
        </div>

        {/* Sidebar Related / Recommended Videos */}
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#161B26] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#818CF8]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">AI Curation Logic</span>
            </div>
            <span className="text-[11px] text-[#818CF8] font-medium">{aiReason}</span>
          </div>

          <div className="space-y-4">
            {relatedVideos.map((rel) => (
              <VideoCard
                key={rel._id}
                video={rel}
                layout="compact"
                onOpenPlaylistModal={(v) => {
                  setShowPlaylistModal(true);
                }}
                onOpenShareModal={(v) => {
                  setShowShareModal(true);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPlaylistModal && (
        <PlaylistModal
          video={video}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}
      {showShareModal && (
        <ShareModal
          video={video}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};
