import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Video as VideoIcon,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Lock,
  Tag as TagIcon,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { VideoCategory } from '../types';
import { getEmbedInfo, formatVideoDuration } from '../utils/videoUtils';

export const UploadPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<VideoCategory>('Technology');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>(['react', 'webdev', '4k']);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('public');
  const [isShort, setIsShort] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFileName, setVideoFileName] = useState('');
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isVideoDragging, setIsVideoDragging] = useState(false);
  const [isThumbDragging, setIsThumbDragging] = useState(false);

  const processVideoFile = async (file: File) => {
    if (!file) return;
    setVideoFileName(file.name);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/videos/upload-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadRes.data?.url) {
        setVideoUrl(uploadRes.data.url);
        return;
      }
    } catch (uploadErr) {
      console.warn('Direct upload fallback to dataURL:', uploadErr);
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setVideoUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const processThumbFile = async (file: File) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/videos/upload-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadRes.data?.url) {
        setThumbnailUrl(uploadRes.data.url);
        return;
      }
    } catch (err) {
      console.warn('Thumbnail upload fallback:', err);
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setThumbnailUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const categories: VideoCategory[] = [
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

  if (!user) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-[#161B26] rounded-3xl border border-white/15 text-center space-y-4">
        <VideoIcon className="w-16 h-16 text-[#FF4D6D] mx-auto" />
        <h2 className="text-2xl font-bold text-white">Creator Account Required</h2>
        <p className="text-sm text-gray-400">Please sign in to your VIEWPOINT creator account to upload and publish videos.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-8 py-3 bg-[#FF4D6D] text-white rounded-full font-bold text-sm shadow-lg shadow-[#FF4D6D]/30"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagsInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagsInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAiSeoAssist = async () => {
    if (!title && !tagsInput) {
      alert('Please enter at least a draft title or topic keyword first!');
      return;
    }
    setIsGeneratingAi(true);
    try {
      const res = await api.post('/ai/seo-assistant', {
        topic: title || tagsInput || 'modern web development tutorial',
      });
      if (res.data.seo) {
        if (res.data.seo.title) setTitle(res.data.seo.title);
        if (res.data.seo.description) setDescription(res.data.seo.description);
        if (res.data.seo.tags && Array.isArray(res.data.seo.tags)) {
          setTags(res.data.seo.tags);
        }
        if (res.data.seo.category) {
          const matched = categories.find((c) => c.toLowerCase() === res.data.seo.category.toLowerCase());
          if (matched) setCategory(matched);
        }
      }
    } catch (err) {
      alert('AI generation fallback applied. Check your draft!');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      setError('Please provide a Title and select a Video file or enter a Video Stream URL.');
      return;
    }

    let finalThumbnail = thumbnailUrl.trim();
    if (!finalThumbnail) {
      const embed = getEmbedInfo(videoUrl);
      if (embed.thumbnailUrl) {
        finalThumbnail = embed.thumbnailUrl;
      } else {
        finalThumbnail = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80';
      }
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(10);

    // Simulate multi-stage upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 300);

    try {
      const finalDuration = detectedDuration && detectedDuration > 0
        ? detectedDuration
        : (isShort ? 45 : 300);
      const finalDurationFormatted = formatVideoDuration(finalDuration);

      const res = await api.post('/videos', {
        title: title.trim(),
        description: description.trim() || `Published on ${new Date().toLocaleDateString()}`,
        thumbnailUrl: finalThumbnail,
        videoUrl: videoUrl.trim(),
        duration: finalDuration,
        durationFormatted: finalDurationFormatted,
        category: isShort ? 'Shorts' : category,
        tags: tags.length > 0 ? tags : ['viewpoint', category.toLowerCase()],
        isShort,
      });

      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        navigate(`/watch/${res.data._id}`);
      }, 800);
    } catch (err: any) {
      clearInterval(interval);
      setIsUploading(false);
      setError(err.response?.data?.error || 'Failed to publish video. Please check your video file or link.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Upload className="w-6 h-6 text-[#FF4D6D]" />
            <span>Upload & Publish Video</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Share your high-definition streams or vertical Shorts with millions of viewers worldwide.
          </p>
        </div>

        {/* Gemini AI SEO Button */}
        <button
          type="button"
          onClick={handleAiSeoAssist}
          disabled={isGeneratingAi}
          className="px-4 py-2 bg-gradient-to-r from-[#818CF8] via-indigo-500 to-purple-600 hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 transition-all hover:scale-102 disabled:opacity-50 flex-shrink-0"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
          <span>{isGeneratingAi ? 'Gemini AI Generating...' : 'AI SEO Assistant'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#FF4D6D]/15 border border-[#FF4D6D] text-[#FF4D6D] text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Media File & Thumbnails */}
        <div className="space-y-4">
          {/* Video File Drop Zone (Drag & Drop or File Manager) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsVideoDragging(true);
            }}
            onDragLeave={() => setIsVideoDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsVideoDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file && (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv)$/i))) {
                processVideoFile(file);
              }
            }}
            className={`p-4 rounded-2xl bg-[#161B26] border-2 border-dashed transition-all space-y-3 text-center group shadow-sm ${
              isVideoDragging ? 'border-[#818CF8] bg-[#818CF8]/10 scale-[1.02]' : 'border-white/20 hover:border-[#818CF8]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 mx-auto flex items-center justify-center text-[#818CF8] group-hover:scale-105 transition-transform">
              <VideoIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xs sm:text-sm">Video Source File</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Drag & drop or select video file (MP4, WebM, MOV)</p>
            </div>

            <div className="flex flex-col items-center justify-center gap-2">
              <label className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors border border-white/15 flex items-center justify-center gap-2 shadow">
                📁 Choose Video from Device
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processVideoFile(file);
                  }}
                />
              </label>

              <div className="w-full pt-2 border-t border-white/10">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                  Or Paste Video Stream URL
                </span>
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=... or https://media.w3.org/movie.mp4"
                  value={videoUrl.startsWith('data:') ? '' : videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    setVideoFileName('URL Video Stream');
                  }}
                  className="w-full px-3 py-2 bg-black/50 border border-white/15 focus:border-[#818CF8] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            {videoUrl ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black mt-2 border border-white/10 shadow group/vid">
                {getEmbedInfo(videoUrl).isEmbed ? (
                  <iframe
                    src={getEmbedInfo(videoUrl).embedUrl}
                    title="Video Preview"
                    className="w-full h-full border-0 pointer-events-auto"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={videoUrl}
                    controls
                    onLoadedMetadata={(e) => {
                      const dur = Math.round(e.currentTarget.duration);
                      if (dur && !isNaN(dur) && isFinite(dur) && dur > 0) {
                        setDetectedDuration(dur);
                      }
                    }}
                    className="w-full h-full object-contain"
                  />
                )}
                <div className="p-2 bg-black/80 flex items-center justify-between border-t border-white/10 text-left">
                  <span className="text-[11px] text-indigo-400 font-semibold truncate max-w-[180px]">
                    {videoFileName || 'Selected Video File'}
                    {detectedDuration ? ` (${formatVideoDuration(detectedDuration)})` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrl('');
                      setVideoFileName('');
                      setDetectedDuration(null);
                    }}
                    className="text-[10px] text-red-400 hover:text-red-300 underline font-medium whitespace-nowrap ml-2"
                  >
                    Remove Video
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-black/20 rounded-lg border border-white/5 text-[11px] text-gray-400">
                No video file chosen yet. Drag & drop or select from your device.
              </div>
            )}
          </div>

          {/* Custom Thumbnail Drop Zone (Drag & Drop or File Manager) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsThumbDragging(true);
            }}
            onDragLeave={() => setIsThumbDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsThumbDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file && (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|gif)$/i))) {
                processThumbFile(file);
              }
            }}
            className={`p-4 rounded-2xl bg-[#161B26] border-2 border-dashed transition-all space-y-3 text-center group shadow-sm ${
              isThumbDragging ? 'border-[#00C853] bg-[#00C853]/10 scale-[1.02]' : 'border-white/20 hover:border-[#818CF8]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 mx-auto flex items-center justify-center text-[#00C853] group-hover:scale-105 transition-transform">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xs sm:text-sm">Custom Thumbnail</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Drag & drop or select image (16:9 ratio recommended)</p>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-2">
              <label className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors border border-white/15 flex items-center justify-center gap-2 shadow">
                📁 Choose Image from Device
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processThumbFile(file);
                  }}
                />
              </label>
            </div>

            {thumbnailUrl ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black mt-2 border border-white/10 shadow group/thumb">
                <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <span className="text-[11px] text-emerald-400 font-semibold bg-black/80 px-2.5 py-1 rounded-md border border-emerald-500/30">
                    Selected Image
                  </span>
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl('')}
                    className="text-[10px] text-red-400 hover:text-red-300 underline font-medium"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-black/20 rounded-lg border border-white/5 text-[11px] text-gray-400">
                No thumbnail image chosen yet. Drag & drop or select from your device.
              </div>
            )}
          </div>

          {/* Short Format Toggle */}
          <div className="p-3.5 rounded-2xl bg-[#161B26] border border-white/15 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <span>⚡ VIEWPOINT Short</span>
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Vertical 9:16 video feed</p>
            </div>
            <input
              type="checkbox"
              checked={isShort}
              onChange={(e) => setIsShort(e.target.checked)}
              className="w-4 h-4 rounded accent-[#FF4D6D] cursor-pointer"
            />
          </div>
        </div>

        {/* Right 2 Columns: Metadata & Publish */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
              Video Title <span className="text-[#FF4D6D]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Building a Scalable Streaming Platform in React & Express"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#161B26] border border-white/20 focus:border-[#818CF8] rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none transition-colors"
              required
              maxLength={100}
            />
            <div className="flex justify-between text-[10px] text-gray-500 px-1">
              <span>Use engaging, descriptive titles for higher search rankings</span>
              <span>{title.length}/100</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Tell viewers about your video, include timestamps or links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#161B26] border border-white/20 focus:border-[#818CF8] rounded-xl p-3 text-xs text-white focus:outline-none transition-colors leading-relaxed"
            />
          </div>

          {/* Category & Visibility Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                disabled={isShort}
                className="w-full bg-[#161B26] border border-white/20 focus:border-[#818CF8] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none disabled:opacity-50"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                Privacy & Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className="w-full bg-[#161B26] border border-white/20 focus:border-[#818CF8] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
              >
                <option value="public">🌐 Public (Anyone can search and view)</option>
                <option value="unlisted">🔗 Unlisted (Anyone with link can view)</option>
                <option value="private">🔒 Private (Only you can view)</option>
              </select>
            </div>
          </div>

          {/* Tags / Keywords */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
              Tags & Keywords (Press Enter or Comma to add)
            </label>
            <div className="bg-[#161B26] border border-white/20 rounded-xl p-2.5 flex flex-wrap gap-1.5 focus-within:border-[#818CF8] transition-colors">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 bg-white/10 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 group"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-400 hover:text-[#FF4D6D] font-bold"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tag..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="bg-transparent text-xs text-white focus:outline-none flex-1 min-w-[100px] py-0.5"
              />
            </div>
          </div>

          {/* Progress Bar during upload */}
          {isUploading && (
            <div className="p-4 rounded-2xl bg-[#161B26] border border-white/15 space-y-2.5 animate-pulse">
              <div className="flex justify-between text-xs font-bold text-white">
                <span>Encoding & Distributing to CDN...</span>
                <span className="text-[#818CF8]">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF4D6D] via-[#818CF8] to-[#00C853] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || isGeneratingAi}
              className="px-6 py-2.5 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-[#FF4D6D]/30 flex items-center gap-2 text-xs transition-transform hover:scale-102"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Publishing Video...' : 'Publish Video Now'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
