import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Link2, Check, Sparkles, RefreshCw, Trash2, FolderOpen } from 'lucide-react';

interface AvatarPickerProps {
  currentAvatar: string;
  onSelectAvatar: (avatarUrl: string) => void;
  label?: string;
  className?: string;
}

const PRESET_AVATARS = [
  // 3D & Abstract Creator Portraits
  { name: 'Cyber Neon', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80', category: 'Abstract' },
  { name: 'Cosmic Sphere', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=400&auto=format&fit=crop&q=80', category: 'Abstract' },
  { name: 'Digital Fluid', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80', category: 'Abstract' },
  
  // Diverse Creator Portraits
  { name: 'Pro Creator 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80', category: 'Portraits' },
  { name: 'Pro Creator 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', category: 'Portraits' },
  { name: 'Pro Creator 3', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80', category: 'Portraits' },
  { name: 'Pro Creator 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80', category: 'Portraits' },

  // Gaming Bots & Avataaars
  { name: 'Mecha Bot Beta', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Beta&backgroundColor=b6e3f4,c0aede,d1d4f9', category: 'Gaming' },
  { name: 'Mecha Bot Nova', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nova&backgroundColor=ffdfbf,ffd5dc', category: 'Gaming' },
  { name: 'Anime Alex', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Alex&backgroundColor=b6e3f4', category: 'Anime' },
  { name: 'Anime Sakura', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sakura&backgroundColor=ffd5dc', category: 'Anime' },
  { name: 'Pixel Gamer', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=GamerPro', category: 'Gaming' },
];

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  currentAvatar,
  onSelectAvatar,
  label = 'Profile Photo Setting',
  className = '',
}) => {
  // Industry Standard: Default directly to 'upload' (Device File Manager)
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [customUrl, setCustomUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Industry Standard: Client-side compression and square cropping so payloads are lightweight and clean
  const processAndCompressImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose a valid image file (PNG, JPG, WEBP, GIF).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File is too large. Please select an image under 15MB.');
      return;
    }

    setIsProcessing(true);
    setUploadError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400; // Industry standard 400x400 avatar profile resolution
        let width = img.width;
        let height = img.height;

        // Crop to square aspect ratio from center
        const size = Math.min(width, height);
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, size, size, 0, 0, MAX_SIZE, MAX_SIZE);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          onSelectAvatar(compressedBase64);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        setUploadError('Failed to process image format. Try another file.');
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setUploadError('Error reading file from device.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndCompressImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndCompressImage(file);
    }
  };

  const handleRandomize = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const styles = ['bottts', 'lorelei', 'avataaars', 'fun-emoji', 'identicon'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const randomUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    onSelectAvatar(randomUrl);
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    onSelectAvatar(customUrl.trim());
    setCustomUrl('');
  };

  const handleResetDefault = () => {
    onSelectAvatar('https://api.dicebear.com/7.x/avataaars/svg?seed=default');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden File Input always ready for direct file manager trigger */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Minimized YouTube Studio Standard Layout */}
      <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/15 hover:border-white/25 transition-all shadow-inner">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Circular Preview - Clicking directly opens File Manager! */}
          <div
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className="relative flex-shrink-0 group cursor-pointer"
            title="Click image to open device file manager"
          >
            <img
              src={currentAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt="Profile Preview"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-2 ring-white/20 group-hover:ring-[#FF4D6D] bg-gray-900 shadow-2xl transition-all group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback';
              }}
            />
            <div className="absolute inset-0 bg-black/70 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="w-5 h-5 text-white mb-0.5" />
              <span className="text-[9px] font-black text-white uppercase tracking-wider">Change</span>
            </div>
            {isProcessing && (
              <div className="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#FF4D6D] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Description and Action Buttons */}
          <div className="flex-1 min-w-0 text-center sm:text-left space-y-2.5">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm font-extrabold text-white">{label}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00C853]/20 text-[#00C853] uppercase tracking-wider">Standard</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
              Your profile picture will appear where your channel is presented on ViewPoint, like next to your videos and comments. Recommended 400x400 PNG or JPG.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 transition-transform hover:scale-102 cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Upload from device</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'presets' ? 'upload' : 'presets')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'presets' ? 'bg-[#818CF8] text-black font-extrabold' : 'bg-white/10 hover:bg-white/20 text-gray-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{activeTab === 'presets' ? 'Hide Presets' : 'Choose Preset'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'url' ? 'upload' : 'url')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'url' ? 'bg-white/20 text-white font-extrabold' : 'bg-white/10 hover:bg-white/20 text-gray-200'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{activeTab === 'url' ? 'Hide URL' : 'Web URL'}</span>
              </button>
              <button
                type="button"
                onClick={handleRandomize}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-[#818CF8] font-bold text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                title="Random AI Avatar"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">AI Generator</span>
              </button>
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="mt-3 p-2.5 bg-[#FF4D6D]/15 border border-[#FF4D6D] rounded-xl text-xs font-bold text-[#FF4D6D] flex items-center gap-2">
            <span>⚠️ {uploadError}</span>
          </div>
        )}
      </div>

      {/* Preset Gallery Expansion when toggled */}
      {activeTab === 'presets' && (
        <div className="p-4 rounded-2xl bg-black/60 border border-white/15 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300">Select Creator Preset or AI Avatar</span>
            <button type="button" onClick={() => setActiveTab('upload')} className="text-xs text-[#FF4D6D] hover:underline font-bold">Close Gallery</button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1">
            {PRESET_AVATARS.map((preset, idx) => {
              const isSelected = currentAvatar === preset.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectAvatar(preset.url)}
                  className={`relative group rounded-xl overflow-hidden aspect-square border-2 transition-all transform hover:scale-105 ${
                    isSelected ? 'border-[#818CF8] ring-2 ring-[#818CF8]/50 shadow-lg shadow-[#818CF8]/20' : 'border-white/10 hover:border-white/30'
                  }`}
                  title={preset.name}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover bg-gray-900" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#818CF8]/40 flex items-center justify-center">
                      <Check className="w-5 h-5 text-black stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Web URL Expansion when toggled */}
      {activeTab === 'url' && (
        <div className="p-4 rounded-2xl bg-black/60 border border-white/15 space-y-2 animate-fade-in">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyUrl();
                  setActiveTab('upload');
                }
              }}
              className="flex-1 bg-black/40 border border-white/20 focus:border-[#818CF8] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => {
                handleApplyUrl();
                setActiveTab('upload');
              }}
              className="px-4 py-2 bg-[#818CF8] hover:bg-[#818CF8]/90 text-black font-bold rounded-xl text-xs sm:text-sm transition-transform hover:scale-105"
            >
              Apply URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
