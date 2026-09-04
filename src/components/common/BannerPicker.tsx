import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Link2, Check, Sparkles, FolderOpen, Trash2 } from 'lucide-react';

interface BannerPickerProps {
  currentBanner: string;
  onSelectBanner: (bannerUrl: string) => void;
  label?: string;
  className?: string;
}

const PRESET_BANNERS = [
  { name: 'Cyberpunk Neon', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80' },
  { name: 'Abstract Nebula', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1600&auto=format&fit=crop&q=80' },
  { name: 'Dark Horizon', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80' },
  { name: 'Synthwave Grid', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&auto=format&fit=crop&q=80' },
  { name: 'Tech Matrix', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&auto=format&fit=crop&q=80' },
  { name: 'Minimalist Dark', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80' },
];

export const BannerPicker: React.FC<BannerPickerProps> = ({
  currentBanner,
  onSelectBanner,
  label = 'Channel Banner Image',
  className = '',
}) => {
  // Industry Standard: Default to 'upload' (Device File Manager)
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [customUrl, setCustomUrl] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Industry Standard: Client-side compression for banners
  const processAndCompressBanner = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Banner image size must be less than 20MB.');
      return;
    }

    setIsProcessing(true);
    setUploadError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1400; // Optimal banner resolution width
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          onSelectBanner(compressedBase64);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        setUploadError('Failed to process banner format. Try another file.');
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
      processAndCompressBanner(file);
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
      processAndCompressBanner(file);
    }
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) return;
    onSelectBanner(customUrl.trim());
    setCustomUrl('');
  };

  const handleResetDefault = () => {
    onSelectBanner(PRESET_BANNERS[0].url);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden File Input always ready for direct file manager trigger */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Minimized YouTube Studio Standard Banner Layout */}
      <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/15 hover:border-white/25 transition-all shadow-inner">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Rectangular Preview - Clicking directly opens File Manager! */}
          <div
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className="relative w-full sm:w-48 h-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 group cursor-pointer border border-white/10"
            title="Click banner image to open device file manager"
          >
            <img
              src={currentBanner || PRESET_BANNERS[0].url}
              alt="Banner Preview"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PRESET_BANNERS[0].url;
              }}
            />
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="w-5 h-5 text-white mb-0.5" />
              <span className="text-[9px] font-black text-white uppercase tracking-wider">Change Banner</span>
            </div>
            {isProcessing && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#818CF8] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Description and Action Buttons */}
          <div className="flex-1 min-w-0 text-center sm:text-left space-y-2.5">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm font-extrabold text-white">{label}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#818CF8]/20 text-[#818CF8] uppercase tracking-wider">Standard</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
              This image will appear across the top of your channel. For best results on all devices, use an image at least 1600x400 pixels and 20MB or less.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#818CF8] hover:bg-[#818CF8]/90 text-black font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 transition-transform hover:scale-102 cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Upload from device</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'presets' ? 'upload' : 'presets')}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'presets' ? 'bg-[#FF4D6D] text-white font-extrabold' : 'bg-white/10 hover:bg-white/20 text-gray-200'
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
                onClick={handleResetDefault}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs rounded-xl flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                title="Reset Banner"
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                <span className="hidden md:inline">Reset</span>
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
            <span className="text-xs font-bold text-gray-300">Select Preset Banner Style</span>
            <button type="button" onClick={() => setActiveTab('upload')} className="text-xs text-[#818CF8] hover:underline font-bold">Close Gallery</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
            {PRESET_BANNERS.map((preset, idx) => {
              const isSelected = currentBanner === preset.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelectBanner(preset.url);
                    setActiveTab('upload');
                  }}
                  className={`relative group rounded-xl overflow-hidden h-20 border-2 transition-all transform hover:scale-102 ${
                    isSelected ? 'border-[#818CF8] ring-2 ring-[#818CF8]/50 shadow-lg' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[11px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">{preset.name}</span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-[#818CF8] text-black p-1 rounded-full shadow">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
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
              placeholder="https://example.com/banner.jpg"
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
