import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, X, Maximize2, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';
import { getWorkingVideoUrl, getFallbackVideoUrl, getEmbedInfo } from '../../utils/videoUtils';

export const MiniPlayer: React.FC = () => {
  const { activeMiniVideo, isMiniPlayerOpen, closeMiniPlayer, nextInQueue } = usePlayerStore();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [errorAttempt, setErrorAttempt] = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string>(() => getWorkingVideoUrl(activeMiniVideo?.videoUrl));
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeMiniVideo?.videoUrl) {
      setCurrentSrc(getWorkingVideoUrl(activeMiniVideo.videoUrl));
      setErrorAttempt(0);
    }
  }, [activeMiniVideo?._id, activeMiniVideo?.videoUrl]);

  if (!isMiniPlayerOpen || !activeMiniVideo) {
    return null;
  }

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleExpand = () => {
    closeMiniPlayer();
    navigate(`/watch/${activeMiniVideo._id}`);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVid = nextInQueue();
    if (nextVid && videoRef.current) {
      const workingUrl = getWorkingVideoUrl(nextVid.videoUrl);
      setCurrentSrc(workingUrl);
      videoRef.current.src = workingUrl;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="fixed bottom-16 md:bottom-4 right-3 left-3 sm:left-auto sm:right-4 z-50 sm:w-96 bg-[#161B26] border border-white/15 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 animate-slide-up">
      {/* Video Container */}
      <div
        className="relative w-full aspect-video bg-black cursor-pointer group"
        onClick={handleExpand}
      >
        {getEmbedInfo(currentSrc || activeMiniVideo.videoUrl).isEmbed ? (
          <iframe
            src={getEmbedInfo(currentSrc || activeMiniVideo.videoUrl).embedUrl}
            title={activeMiniVideo.title}
            className="w-full h-full border-0 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={currentSrc}
            autoPlay
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
            onEnded={() => handleNext({ stopPropagation: () => {} } as any)}
            onError={() => {
              if (errorAttempt < 5) {
                const nextUrl = getFallbackVideoUrl(currentSrc, errorAttempt);
                setCurrentSrc(nextUrl);
                setErrorAttempt((prev) => prev + 1);
              }
            }}
          />
        )}

        {/* Hover Controls Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-3">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
              aria-label="Mute toggle"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
              aria-label="Next in queue"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={handleExpand}
              className="p-2 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
              title="Expand to Full Player"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top right close button always visible */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            closeMiniPlayer();
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-black text-white transition-colors"
          title="Close Mini Player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Info bar */}
      <div className="p-3 bg-[#161B26] flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white truncate">{activeMiniVideo.title}</p>
          <p className="text-[11px] text-gray-400 truncate mt-0.5">{activeMiniVideo.channelName}</p>
        </div>
        <span className="text-[10px] uppercase font-bold text-[#FF4D6D] bg-[#FF4D6D]/10 px-2 py-0.5 rounded flex-shrink-0">
          MINI
        </span>
      </div>
    </div>
  );
};
