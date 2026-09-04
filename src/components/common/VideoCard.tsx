import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  MoreVertical,
  Clock,
  ListPlus,
  Share2,
  Play,
  Download,
  Flame,
  Trash2
} from 'lucide-react';
import { Video } from '../../types';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';
import { isUserVideoUploader, downloadVideoFile, formatVideoDuration } from '../../utils/videoUtils';

interface VideoCardProps {
  video: Video;
  layout?: 'grid' | 'list' | 'compact';
  onOpenPlaylistModal?: (video: Video) => void;
  onOpenShareModal?: (video: Video) => void;
  onDelete?: (videoId: string) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  layout = 'grid',
  onOpenPlaylistModal,
  onOpenShareModal,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toggleWatchLater, watchLater, openMiniPlayer } = usePlayerStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const isSavedToWatchLater = watchLater.some((v) => v._id === video._id);
  const creatorId = typeof video.creator === 'object' ? (video.creator._id || (video.creator as any).id) : video.creator;
  const isUploader = isUserVideoUploader(user, video);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadVideoFile(video);
    } catch (err) {
      console.error('VideoCard download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (window.confirm(`Are you sure you want to delete "${video.title}"? This cannot be undone.`)) {
      try {
        const baseId = video._id.split('-more-')[0];
        await api.delete(`/videos/${baseId}`);
        window.dispatchEvent(new CustomEvent('video-deleted', { detail: { videoId: video._id, baseId } }));
        const activeMini = usePlayerStore.getState().activeMiniVideo;
        if (activeMini && (activeMini._id === video._id || activeMini._id === baseId)) {
          usePlayerStore.getState().closeMiniPlayer();
        }
        if (isSavedToWatchLater) {
          toggleWatchLater(video);
        }
        if (onDelete) {
          onDelete(video._id);
        }
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete video.');
      }
    }
  };

  const formatViews = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
    if (diffSec < 2592000) return `${Math.floor(diffSec / 604800)} weeks ago`;
    return `${Math.floor(diffSec / 2592000)} months ago`;
  };

  const handleWatchLaterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchLater(video);
    setShowMenu(false);
  };

  if (layout === 'compact') {
    return (
      <div className="flex gap-3 group cursor-pointer relative" onClick={() => navigate(`/watch/${video._id}`)}>
        <div className="relative w-40 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-900">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 text-[10px] font-medium text-white rounded">
            {formatVideoDuration(video.duration, video.durationFormatted)}
          </span>
          {video.isLive && (
            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#FF4D6D] text-[9px] font-bold text-white rounded uppercase flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 py-0.5 pr-6">
          <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-[#818CF8] transition-colors leading-snug">
            {video.title}
          </h4>
          <p className="text-[11px] text-gray-400 mt-1 truncate">{video.channelName}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {formatViews(video.views)} views • {formatTimeAgo(video.createdAt)}
          </p>
        </div>

        {/* Action menu button */}
        <div className="absolute top-1 right-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            aria-label="More actions"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-6 w-48 bg-[#161B26] border border-white/15 rounded-xl shadow-2xl py-1.5 z-40 text-xs text-gray-200"
            >
              <button
                onClick={handleWatchLaterClick}
                className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
              >
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{isSavedToWatchLater ? 'Remove from Watch Later' : 'Save to Watch Later'}</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  if (onOpenPlaylistModal) onOpenPlaylistModal(video);
                }}
                className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
              >
                <ListPlus className="w-4 h-4 text-gray-400" />
                <span>Save to playlist</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  if (onOpenShareModal) onOpenShareModal(video);
                }}
                className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
              >
                <Share2 className="w-4 h-4 text-gray-400" />
                <span>Share video</span>
              </button>

              <button
                onClick={handleDelete}
                className="w-full px-3 py-2 text-left hover:bg-[#FF4D6D]/20 text-[#FF4D6D] flex items-center gap-2.5 transition-colors font-medium border-t border-white/10 mt-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-[#FF4D6D]" />
                <span>Delete Video</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="flex flex-col sm:flex-row gap-4 group cursor-pointer bg-[#161B26]/40 hover:bg-[#161B26] p-3 rounded-2xl transition-all border border-transparent hover:border-white/10" onClick={() => navigate(`/watch/${video._id}`)}>
        <div className="relative w-full sm:w-80 h-44 sm:h-44 flex-shrink-0 rounded-xl overflow-hidden bg-gray-900">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-xs font-medium text-white rounded-md">
            {formatVideoDuration(video.duration, video.durationFormatted)}
          </span>
          {video.isLive && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#FF4D6D] text-xs font-bold text-white rounded uppercase flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 group-hover:text-[#818CF8] transition-colors leading-snug">
                {video.title}
              </h3>
              
              <div className="relative flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                  aria-label="More actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-6 w-48 bg-[#161B26] border border-white/15 rounded-xl shadow-2xl py-1.5 z-40 text-xs text-gray-200"
                  >
                    <button
                      onClick={handleWatchLaterClick}
                      className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{isSavedToWatchLater ? 'Remove from Watch Later' : 'Save to Watch Later'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        if (onOpenPlaylistModal) onOpenPlaylistModal(video);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <ListPlus className="w-4 h-4 text-gray-400" />
                      <span>Save to playlist</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        if (onOpenShareModal) onOpenShareModal(video);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-gray-400" />
                      <span>Share video</span>
                    </button>

                    {isUploader && (
                      <button
                        onClick={handleDelete}
                        className="w-full px-3 py-2 text-left hover:bg-[#FF4D6D]/20 text-[#FF4D6D] flex items-center gap-2.5 transition-colors font-medium border-t border-white/10 mt-1"
                      >
                        <Trash2 className="w-4 h-4 text-[#FF4D6D]" />
                        <span>Delete Video</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-1">
              {formatViews(video.views)} views • {formatTimeAgo(video.createdAt)}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <img
                src={video.channelAvatar}
                alt={video.channelName}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-xs font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                {video.channelName}
                {video.verified && <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 fill-gray-400/20" />}
              </span>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2 mt-3 leading-relaxed">
              {video.description}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-white/5">
            <span className="text-[11px] px-2 py-0.5 bg-white/5 rounded-full text-gray-400">
              #{video.category}
            </span>
            {video.aiRecommendedReason && (
              <span className="text-[11px] px-2 py-0.5 bg-[#818CF8]/10 text-[#818CF8] rounded-full flex items-center gap-1 font-medium">
                <Flame className="w-3 h-3" /> AI Recommended
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default Grid Layout
  return (
    <div
      className="flex flex-col group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/watch/${video._id}`)}
    >
      {/* Thumbnail Container */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#161B26] shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:shadow-black/60 group-hover:-translate-y-1">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
        />
        
        {/* Duration badge */}
        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/80 backdrop-blur-sm text-xs font-semibold text-white rounded-md tracking-wider">
          {formatVideoDuration(video.duration, video.durationFormatted)}
        </span>

        {/* Live badge */}
        {video.isLive && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-[#FF4D6D] text-[11px] font-bold text-white rounded-md uppercase flex items-center gap-1.5 shadow-lg animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
          </span>
        )}

        {/* Hover overlay quick action buttons */}
        <div className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity flex items-center justify-center gap-3 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/watch/${video._id}`);
            }}
            className="w-12 h-12 rounded-full bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 flex items-center justify-center text-white shadow-xl transition-transform hover:scale-110"
            title="Play Video"
          >
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openMiniPlayer(video);
            }}
            className="w-10 h-10 rounded-full bg-black/80 hover:bg-black flex items-center justify-center text-white border border-white/20 transition-transform hover:scale-110"
            title="Pop out to Mini Player"
          >
            <span className="text-[10px] font-bold">MINI</span>
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex gap-3 mt-3 px-0.5">
        <Link
          to={`/channel/${creatorId}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0"
        >
          <img
            src={video.channelAvatar}
            alt={video.channelName}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-transparent group-hover:ring-[#FF4D6D] transition-all"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-[#818CF8] transition-colors leading-snug">
              {video.title}
            </h3>
            
            {/* Three dot menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 -mr-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                aria-label="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-6 w-48 bg-[#161B26] border border-white/15 rounded-xl shadow-2xl py-1.5 z-40 text-xs text-gray-200"
                >
                  <button
                    onClick={handleWatchLaterClick}
                    className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{isSavedToWatchLater ? 'Remove from Watch Later' : 'Save to Watch Later'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (onOpenPlaylistModal) onOpenPlaylistModal(video);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                  >
                    <ListPlus className="w-4 h-4 text-gray-400" />
                    <span>Save to playlist</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (onOpenShareModal) onOpenShareModal(video);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-gray-400" />
                    <span>Share video</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Download className={`w-4 h-4 ${isDownloading ? 'text-[#00C853] animate-bounce' : 'text-gray-400'}`} />
                    <span>{isDownloading ? 'Downloading...' : 'Download video'}</span>
                  </button>

                  {isUploader && (
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-2 text-left hover:bg-[#FF4D6D]/20 text-[#FF4D6D] flex items-center gap-2.5 transition-colors font-medium border-t border-white/10 mt-1"
                    >
                      <Trash2 className="w-4 h-4 text-[#FF4D6D]" />
                      <span>Delete Video</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <Link
            to={`/channel/${creatorId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1 mt-1"
          >
            <span className="truncate">{video.channelName}</span>
            {video.verified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 fill-gray-400/20 flex-shrink-0" />
            )}
          </Link>

          <p className="text-xs text-gray-400 mt-0.5">
            {formatViews(video.views)} views • {formatTimeAgo(video.createdAt)}
          </p>

          {video.aiRecommendedReason && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#818CF8] bg-[#818CF8]/10 px-2 py-0.5 rounded-full w-fit font-medium">
              <Flame className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{video.aiRecommendedReason}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
