import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Tv,
  SkipForward,
  Subtitles,
  Check,
  Info
} from 'lucide-react';
import { Video } from '../../types';
import { useThemeStore } from '../../store/useThemeStore';
import { getWorkingVideoUrl, getFallbackVideoUrl, getEmbedInfo } from '../../utils/videoUtils';

interface VideoPlayerProps {
  video: Video;
  onEnded?: () => void;
  onProgress?: (progressPercentage: number) => void;
  startTime?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onEnded, onProgress, startTime }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    theaterMode,
    toggleTheaterMode,
    autoPlay,
    toggleAutoPlay,
    playbackSpeed,
    setPlaybackSpeed,
    quality,
    setQuality
  } = useThemeStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(() =>
    video.duration && !isNaN(video.duration) && video.duration > 0 ? video.duration : 180
  );
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'main' | 'speed' | 'quality'>('main');
  const [showControls, setShowControls] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string>(() => getWorkingVideoUrl(video.videoUrl));
  const [errorAttempt, setErrorAttempt] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const embedInfo = getEmbedInfo(currentVideoSrc || video.videoUrl);

  // Helper to send postMessage commands to iframe embeds (YouTube / Vimeo)
  const sendIframeCommand = (func: string, args: any = '') => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      } catch (e) {
        console.warn('Iframe postMessage command failed:', e);
      }
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Sync video source change on prop update
  useEffect(() => {
    setCurrentVideoSrc(getWorkingVideoUrl(video.videoUrl));
    setErrorAttempt(0);
    setIsPlaying(autoPlay);
    setCurrentTime(0);
    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      setDuration(video.duration);
    }
  }, [video._id, video.videoUrl, video.duration]);

  // Auto-play and time sync logic
  useEffect(() => {
    if (embedInfo.isEmbed) {
      if (autoPlay) {
        sendIframeCommand('playVideo');
        setIsPlaying(true);
      }
    } else if (videoRef.current) {
      if (startTime && startTime > 0) {
        videoRef.current.currentTime = startTime;
      }
      if (autoPlay) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [video._id, currentVideoSrc, startTime, embedInfo.isEmbed]);

  // Embed Timer Loop for progress bar updates when playing iframe
  useEffect(() => {
    let interval: any = null;
    if (embedInfo.isEmbed && isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            if (onEnded) onEnded();
            return 0;
          }
          const next = prev + 1;
          if (onProgress && duration) onProgress(Math.round((next / duration) * 100));
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [embedInfo.isEmbed, isPlaying, duration]);

  // Listen to postMessage responses from YouTube iframe API if available
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data && data.info) {
            if (typeof data.info.currentTime === 'number') {
              setCurrentTime(data.info.currentTime);
            }
            if (typeof data.info.duration === 'number' && data.info.duration > 0) {
              setDuration(data.info.duration);
            }
            if (data.info.playerState === 1) setIsPlaying(true);
            if (data.info.playerState === 2) setIsPlaying(false);
          }
        }
      } catch (e) {
        // Non-JSON message from other extensions, safely ignore
      }
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  // Sync speed change across HTML5 video and iframe
  useEffect(() => {
    if (embedInfo.isEmbed) {
      sendIframeCommand('setPlaybackRate', [playbackSpeed]);
    } else if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, embedInfo.isEmbed]);

  // Sync quality change
  const handleQualitySelect = (selectedQuality: string) => {
    setQuality(selectedQuality);
    setShowSettings(false);
    showToast(`Quality updated to ${selectedQuality}`);

    if (embedInfo.isEmbed) {
      const qMap: Record<string, string> = {
        '2160p 4K Ultra HD': 'highres',
        '1440p 2K QHD': 'hd1440',
        '1080p60 HD': 'hd1080',
        '720p60 HD': 'hd720',
        '480p': 'large',
        '360p': 'medium'
      };
      if (qMap[selectedQuality]) {
        sendIframeCommand('setPlaybackQualityRange', [qMap[selectedQuality]]);
        sendIframeCommand('setPlaybackQuality', [qMap[selectedQuality]]);
      }
    }
  };

  const handleSpeedSelect = (spd: number) => {
    setPlaybackSpeed(spd);
    setShowSettings(false);
    showToast(`Playback speed set to ${spd === 1 ? 'Normal' : spd + 'x'}`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'j':
          e.preventDefault();
          handleSeekDelta(-10);
          break;
        case 'l':
          e.preventDefault();
          handleSeekDelta(10);
          break;
        case 'c':
          e.preventDefault();
          setCaptionsOn(!captionsOn);
          break;
        case 't':
          e.preventDefault();
          toggleTheaterMode();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isFullscreen, isMuted, captionsOn, duration, embedInfo.isEmbed]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2800);
    }
  };

  const togglePlay = () => {
    if (embedInfo.isEmbed) {
      if (isPlaying) {
        sendIframeCommand('pauseVideo');
        setIsPlaying(false);
      } else {
        sendIframeCommand('playVideo');
        setIsPlaying(true);
      }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  };

  const handleSeekDelta = (deltaSeconds: number) => {
    const target = Math.max(0, Math.min(duration, currentTime + deltaSeconds));
    setCurrentTime(target);
    if (embedInfo.isEmbed) {
      sendIframeCommand('seekTo', [target, true]);
    } else if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      if (total && !isNaN(total) && isFinite(total) && total > 0) {
        setDuration(total);
      }

      const activeDuration = total || duration || 1;
      if (onProgress) {
        onProgress(Math.round((current / activeDuration) * 100));
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = pos * duration;
    setCurrentTime(target);

    if (embedInfo.isEmbed) {
      sendIframeCommand('seekTo', [target, true]);
      sendIframeCommand('playVideo');
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
  };

  const handleProgressBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPos(e.clientX - rect.left);
    setHoverTime(pos * duration);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (embedInfo.isEmbed) {
      sendIframeCommand(nextMuted ? 'mute' : 'unMute');
    } else if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const muted = val === 0;
    setIsMuted(muted);

    if (embedInfo.isEmbed) {
      sendIframeCommand('setVolume', [val * 100]);
      if (muted) sendIframeCommand('mute');
      else sendIframeCommand('unMute');
    } else if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = muted;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative w-full bg-black group overflow-hidden rounded-2xl select-none ${
        theaterMode ? 'aspect-[21/9] max-h-[80vh]' : 'aspect-video'
      }`}
    >
      {/* Video Element OR Embed Iframe with JS Controls */}
      {embedInfo.isEmbed ? (
        <div className="relative w-full h-full">
          <iframe
            ref={iframeRef}
            src={embedInfo.embedUrl}
            title={video.title}
            className="w-full h-full border-0 bg-black pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={currentVideoSrc}
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={onEnded}
          playsInline
          preload="auto"
          onError={() => {
            if (errorAttempt < 5) {
              const nextUrl = getFallbackVideoUrl(currentVideoSrc, errorAttempt);
              setCurrentVideoSrc(nextUrl);
              setErrorAttempt((prev) => prev + 1);
            }
          }}
          className="w-full h-full object-contain cursor-pointer"
        />
      )}

      {/* Toast Notification Banner (for Quality, Speed, Captions updates) */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-black/90 border border-[#818CF8]/50 text-[#818CF8] font-bold text-xs rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <Info className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Captions Overlay */}
      {captionsOn && (
        <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none px-4 z-20">
          <span className="bg-black/85 text-white font-semibold text-xs sm:text-sm px-3.5 py-1.5 rounded-lg inline-block shadow-lg border border-white/10">
            [Subtitles] • {video.title}
          </span>
        </div>
      )}

      {/* Big Center Play/Pause Overlay Button */}
      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF4D6D]/90 hover:bg-[#FF4D6D] flex items-center justify-center text-white shadow-2xl transition-all hover:scale-110 z-20 cursor-pointer"
          aria-label="Play Video"
        >
          <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1" />
        </button>
      )}

      {/* Top Header Bar when controls visible */}
      <div
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent transition-opacity duration-300 pointer-events-none flex items-center justify-between z-20 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="min-w-0 pr-4">
          <h2 className="text-sm sm:text-base font-bold text-white truncate drop-shadow">{video.title}</h2>
          <p className="text-xs text-gray-300 truncate mt-0.5">{video.channelName}</p>
        </div>
        <div className="flex items-center gap-2">
          {video.isLive && (
            <span className="px-2.5 py-1 bg-[#FF4D6D] text-white font-bold text-xs rounded uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
            </span>
          )}
          <span className="px-2 py-0.5 bg-black/70 border border-white/20 text-gray-200 font-bold text-[10px] rounded uppercase flex items-center gap-1">
            {quality.includes('4K') ? (
              <span className="text-[#FF4D6D] font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D6D] animate-ping" />
                4K Ultra HD
              </span>
            ) : (
              quality
            )}
          </span>
        </div>
      </div>

      {/* Bottom Custom Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 px-4 pb-3 pt-12 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Seekable Interactive Progress Bar */}
        <div
          onClick={handleSeek}
          onMouseMove={handleProgressBarHover}
          onMouseLeave={() => setHoverTime(null)}
          className="relative w-full h-1.5 hover:h-2.5 bg-white/25 rounded-full cursor-pointer mb-3 transition-all group/progress"
        >
          {/* Loaded buffer bar */}
          <div className="absolute top-0 left-0 h-full bg-white/40 rounded-full w-full" />

          {/* Current playback progress */}
          <div
            className="absolute top-0 left-0 h-full bg-[#FF4D6D] rounded-full relative"
            style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
          >
            {/* Scrubber thumb */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#FF4D6D] rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-lg border border-white" />
          </div>

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 px-2 py-1 bg-black/90 border border-white/20 rounded text-[11px] font-bold text-white pointer-events-none transform -translate-x-1/2 shadow-xl"
              style={{ left: hoverPos }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white">
          {/* Left Controls: Play/Pause, Next, Volume, Time */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 hover:text-[#FF4D6D] transition-colors focus:outline-none cursor-pointer"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white" />}
            </button>

            {onEnded && (
              <button
                type="button"
                onClick={onEnded}
                className="p-1.5 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Next Video"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            )}

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/vol">
              <button type="button" onClick={toggleMute} className="p-1.5 hover:text-gray-300 cursor-pointer">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 overflow-hidden group-hover/vol:w-20 sm:w-20 h-1 bg-white/30 rounded-lg accent-[#FF4D6D] cursor-pointer transition-all"
              />
            </div>

            {/* Time Display */}
            <span className="text-xs font-semibold text-gray-200 select-none">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls: AutoPlay, Subtitles, Settings (Quality & Speed), Theater, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AutoPlay Toggle */}
            <button
              type="button"
              onClick={toggleAutoPlay}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                autoPlay ? 'bg-[#818CF8]/20 border-[#818CF8] text-[#818CF8]' : 'bg-transparent border-white/20 text-gray-400'
              }`}
              title="AutoPlay Next Video"
            >
              <span>AutoPlay</span>
              <span className={`w-2 h-2 rounded-full ${autoPlay ? 'bg-[#818CF8]' : 'bg-gray-500'}`} />
            </button>

            {/* Captions Toggle */}
            <button
              type="button"
              onClick={() => {
                setCaptionsOn(!captionsOn);
                showToast(captionsOn ? 'Subtitles turned off' : 'Subtitles turned on');
              }}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                captionsOn ? 'bg-[#FF4D6D] text-white' : 'hover:bg-white/10 text-gray-300'
              }`}
              title="Subtitles / CC (c)"
            >
              <Subtitles className="w-5 h-5" />
            </button>

            {/* Settings Menu Popup (Quality & Playback Speed) */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(!showSettings);
                  setActiveMenu('main');
                }}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  showSettings ? 'bg-white/25 text-white rotate-45' : 'hover:bg-white/10 text-gray-300'
                }`}
                title="Settings (Quality & Speed)"
              >
                <Settings className="w-5 h-5 transition-transform" />
              </button>

              {showSettings && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-11 right-0 w-56 bg-[#161B26]/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl py-2 z-50 text-xs text-gray-200"
                >
                  {activeMenu === 'main' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveMenu('speed')}
                        className="w-full px-4 py-2.5 text-left hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>Playback Speed</span>
                        <span className="font-bold text-white">{playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveMenu('quality')}
                        className="w-full px-4 py-2.5 text-left hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>Quality</span>
                        <span className="font-bold text-[#818CF8]">{quality}</span>
                      </button>
                    </>
                  ) : activeMenu === 'speed' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveMenu('main')}
                        className="w-full px-4 py-2 text-left font-bold text-gray-400 hover:text-white border-b border-white/10 mb-1 cursor-pointer"
                      >
                        ← Back to settings
                      </button>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                        <button
                          type="button"
                          key={spd}
                          onClick={() => handleSpeedSelect(spd)}
                          className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span>{spd === 1 ? 'Normal' : `${spd}x`}</span>
                          {playbackSpeed === spd && <Check className="w-4 h-4 text-[#FF4D6D]" />}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveMenu('main')}
                        className="w-full px-4 py-2 text-left font-bold text-gray-400 hover:text-white border-b border-white/10 mb-1 cursor-pointer"
                      >
                        ← Back to settings
                      </button>
                      {['2160p 4K Ultra HD', '1440p 2K QHD', '1080p60 HD', '720p60 HD', '480p', '360p'].map((q) => (
                        <button
                          type="button"
                          key={q}
                          onClick={() => handleQualitySelect(q)}
                          className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span>{q}</span>
                            {q.includes('4K') && (
                              <span className="px-1.5 py-0.5 bg-[#FF4D6D] text-white text-[9px] font-extrabold rounded tracking-wider shadow">
                                4K
                              </span>
                            )}
                          </div>
                          {quality === q && <Check className="w-4 h-4 text-[#818CF8]" />}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Theater Mode */}
            <button
              type="button"
              onClick={toggleTheaterMode}
              className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white hidden sm:block cursor-pointer"
              title="Theater Mode (t)"
            >
              <Tv className="w-5 h-5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white cursor-pointer"
              title="Fullscreen (f)"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

