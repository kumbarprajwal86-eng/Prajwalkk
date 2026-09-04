import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Share2, Twitter, Facebook, Mail, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Video } from '../../types';

interface ShareModalProps {
  video: Video | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ video, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [timestampSec, setTimestampSec] = useState(0);
  const [showQr, setShowQr] = useState(true);
  const [customDomain, setCustomDomain] = useState('');

  if (!video) return null;

  // Determine the best base origin for mobile devices
  const getEffectiveOrigin = () => {
    if (customDomain.trim()) {
      let d = customDomain.trim();
      if (!d.startsWith('http://') && !d.startsWith('https://')) {
        d = `https://${d}`;
      }
      return d.replace(/\/+$/, '');
    }

    const origin = window.location.origin;
    // Replace restricted AI Studio dev URL (ais-dev-) with publicly accessible preview URL (ais-pre-)
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
    return origin;
  };

  const effectiveOrigin = getEffectiveOrigin();
  const baseUrl = `${effectiveOrigin}/watch/${video._id}`;
  const shareUrl = includeTimestamp ? `${baseUrl}?t=${timestampSec}` : baseUrl;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    const text = `Check out "${video.title}" on VIEWPOINT!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161B26] border border-white/15 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#818CF8]" />
            <span>Share Video</span>
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Social Icons */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <button
              onClick={shareOnTwitter}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all hover:scale-105"
            >
              <div className="w-10 h-10 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center text-[#1DA1F2]">
                <Twitter className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-300 font-medium">X / Twitter</span>
            </button>
            <button
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all hover:scale-105"
            >
              <div className="w-10 h-10 rounded-full bg-[#4267B2]/20 flex items-center justify-center text-[#4267B2]">
                <Facebook className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-300 font-medium">Facebook</span>
            </button>
            <button
              onClick={() => window.open(`mailto:?subject=${encodeURIComponent(video.title)}&body=${encodeURIComponent(`Check out this video on VIEWPOINT:\n\n${shareUrl}`)}`, '_blank')}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all hover:scale-105"
            >
              <div className="w-10 h-10 rounded-full bg-[#EA4335]/20 flex items-center justify-center text-[#EA4335]">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-300 font-medium">Email</span>
            </button>
            <button
              onClick={() => setShowQr(!showQr)}
              className={`p-3 rounded-2xl flex flex-col items-center gap-2 transition-all hover:scale-105 ${
                showQr ? 'bg-[#818CF8]/20 border border-[#818CF8]' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#00C853]/20 flex items-center justify-center text-[#00C853]">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-300 font-medium">QR Code</span>
            </button>
          </div>

          {/* QR Code Preview */}
          {showQr && (
            <div className="p-4 bg-white rounded-2xl text-center shadow-lg flex flex-col items-center justify-center transition-all">
              <div className="p-3 bg-white border border-gray-200 rounded-xl mb-2 shadow-sm flex items-center justify-center">
                <QRCodeSVG
                  value={shareUrl}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs font-bold text-gray-900 mb-0.5">Scan to watch on mobile</p>
              <p className="text-[11px] text-gray-500 max-w-[280px] truncate font-mono">{shareUrl}</p>
            </div>
          )}

          {/* Copy Link Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Mobile Share URL
              </label>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#818CF8] hover:underline flex items-center gap-1 font-medium"
              >
                <span>Test Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2 bg-black/40 border border-white/20 rounded-2xl p-1.5 pl-4">
              <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent text-sm text-gray-200 focus:outline-none truncate font-mono"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                  copied ? 'bg-[#00C853] text-white' : 'bg-[#818CF8] text-black hover:bg-[#818CF8]/90'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Localhost / Custom Host Option */}
          {isLocalhost && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <span>📱 Local Dev Mobile Tip:</span>
              </p>
              <p className="text-[11px] text-amber-300/80">
                If scanning on a mobile device on your local Wi-Fi, enter your computer&apos;s IP address (e.g., <code className="bg-black/30 px-1 py-0.5 rounded">192.168.1.100:3000</code>) below:
              </p>
              <input
                type="text"
                placeholder="e.g. 192.168.1.100:3000 or mydomain.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="w-full bg-black/40 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-white placeholder-amber-400/40 focus:outline-none"
              />
            </div>
          )}

          {/* Timestamp sharing */}
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="timestamp-check"
              checked={includeTimestamp}
              onChange={(e) => setIncludeTimestamp(e.target.checked)}
              className="w-4 h-4 rounded accent-[#FF4D6D] cursor-pointer"
            />
            <label htmlFor="timestamp-check" className="text-xs font-medium text-gray-300 cursor-pointer flex items-center gap-2">
              <span>Start at</span>
              <input
                type="number"
                min="0"
                value={timestampSec}
                onChange={(e) => setTimestampSec(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={!includeTimestamp}
                className="w-16 bg-[#161B26] border border-white/20 rounded px-2 py-0.5 text-center text-xs text-white disabled:opacity-40 focus:outline-none"
              />
              <span>seconds</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
