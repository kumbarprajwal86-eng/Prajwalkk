import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Twitter, Instagram, Github, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0D1117] border-t border-white/10 py-12 px-6 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="space-y-4">
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF4D6D] flex items-center justify-center shadow-lg shadow-[#FF4D6D]/30">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              VIEW<span className="text-[#FF4D6D]">POINT</span>
            </span>
          </Link>
          <p className="text-sm text-gray-400 leading-relaxed">
            The next generation of high-definition video streaming. Experience lightning-fast playback, AI-powered content curation, and creator-first monetization.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a href="#" className="w-9 h-9 rounded-full bg-[#161B26] hover:bg-[#1F2633] flex items-center justify-center text-gray-300 hover:text-white transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-[#161B26] hover:bg-[#1F2633] flex items-center justify-center text-gray-300 hover:text-white transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-[#161B26] hover:bg-[#1F2633] flex items-center justify-center text-gray-300 hover:text-white transition-colors">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Explore */}
        <div>
          <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Explore</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li><Link to="/home?category=Trending" className="hover:text-white transition-colors">Trending Videos</Link></li>
            <li><Link to="/shorts" className="hover:text-white transition-colors">VIEWPOINT Shorts</Link></li>
            <li><Link to="/home?category=Gaming" className="hover:text-white transition-colors">Gaming Hub</Link></li>
            <li><Link to="/home?category=Music" className="hover:text-white transition-colors">Music & LoFi</Link></li>
            <li><Link to="/home?category=Technology" className="hover:text-white transition-colors">Tech Reviews</Link></li>
          </ul>
        </div>

        {/* Creators */}
        <div>
          <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Creators</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li><Link to="/studio" className="hover:text-white transition-colors">Creator Studio</Link></li>
            <li><Link to="/upload" className="hover:text-white transition-colors">Upload 4K Video</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Monetization & Ads</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Creator Community</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Verification Guidelines</a></li>
          </ul>
        </div>

        {/* Legal & System */}
        <div>
          <h4 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Platform</h4>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li><Link to="/settings" className="hover:text-white transition-colors">Account Settings</Link></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Sign In / Register</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Security & Trust</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <p>© 2026 VIEWPOINT LLC. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Crafted with <Heart className="w-3.5 h-3.5 text-[#FF4D6D] fill-[#FF4D6D]" /> for production performance.
        </p>
      </div>
    </footer>
  );
};
