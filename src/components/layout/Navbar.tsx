import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Mic,
  Bell,
  Upload,
  User as UserIcon,
  LogOut,
  Settings,
  ShieldAlert,
  Moon,
  Sun,
  Play,
  Menu,
  Check,
  Video as VideoIcon,
  Bookmark,
  History,
  X,
  ArrowLeft,
  Share2,
  Tv,
  Palette,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore, THEME_OPTIONS, AppTheme } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { api } from '../../lib/api';
import { VoiceSearchModal } from '../common/VoiceSearchModal';
import { SocialSyncModal } from '../common/SocialSyncModal';

interface NavbarProps {
  toggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, toggleTheme } = useThemeStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isSocialSyncOpen, setIsSocialSyncOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Sync search query with URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) setSearchQuery(q);
  }, [location.search]);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete fetch simulation
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const sampleSuggestions = [
        `${searchQuery} tutorial`,
        `${searchQuery} review`,
        `${searchQuery} in 4k`,
        `${searchQuery} live stream`,
        `best of ${searchQuery}`,
        `${searchQuery} shorts`
      ];
      setSuggestions(sampleSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/search?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (sug: string) => {
    setSearchQuery(sug);
    setShowSuggestions(false);
    navigate(`/search?search=${encodeURIComponent(sug)}`);
  };

  const startVoiceSearch = () => {
    setIsVoiceSearchOpen(true);
  };

  const handleVoiceSearchResult = (query: string) => {
    if (query) {
      setSearchQuery(query);
      navigate(`/search?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-[#0D1117]/90 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 flex items-center justify-between">
      {/* Mobile Active Search Bar Mode */}
      {isMobileSearchOpen ? (
        <div className="flex sm:hidden items-center gap-2 w-full">
          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className="p-1.5 text-gray-300 hover:text-white rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center relative">
            <input
              type="text"
              placeholder="Search videos..."
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161B26] border border-white/20 focus:border-[#818CF8] rounded-full py-1.5 pl-4 pr-8 text-sm text-white placeholder-gray-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-1 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
          <button
            onClick={startVoiceSearch}
            className="p-2 bg-[#161B26] rounded-full border border-white/10 text-gray-300 hover:text-white"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Left section: Menu button & Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <Link to={user ? "/home" : "/"} className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-[#FF4D6D] flex items-center justify-center shadow-lg shadow-[#FF4D6D]/30 group-hover:scale-105 transition-transform">
                <Tv className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1">
                View <span className="text-[#FF4D6D]">Point</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-1.5 py-0.5 bg-white/10 rounded text-gray-400 border border-white/10 ml-1">
                  PRO
                </span>
              </span>
            </Link>
          </div>

          {/* Center section: Search Bar & Voice Search */}
          <div className="flex-1 max-w-2xl mx-4 hidden sm:flex items-center gap-3" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center relative">
              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  placeholder="Search videos, creators, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-[#161B26] border border-white/15 focus:border-[#818CF8] rounded-l-full py-2 pl-4 pr-10 text-sm text-white placeholder-gray-400 focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 p-1 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="bg-[#1F2633] hover:bg-[#333333] border border-l-0 border-white/15 rounded-r-full px-6 py-2 flex items-center justify-center transition-colors focus:outline-none"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-gray-300" />
              </button>

              {/* Autocomplete Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-14 mt-1 bg-[#161B26] border border-white/10 rounded-2xl shadow-2xl py-2 z-50">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSuggestionClick(sug)}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-3 transition-colors"
                    >
                      <Search className="w-4 h-4 text-gray-400" />
                      <span>{sug}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>

            <button
              onClick={startVoiceSearch}
              className="p-2.5 bg-[#161B26] hover:bg-[#1F2633] rounded-full border border-white/10 text-gray-300 hover:text-white transition-colors"
              title="Search with your voice"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          {/* Right section: Actions & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Mobile Search Icon trigger */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-2 hover:bg-white/10 rounded-full sm:hidden text-white"
              aria-label="Open search"
            >
              <Search className="w-5 h-5" />
            </button>

        {/* Social Sync Button */}
        <button
          onClick={() => setIsSocialSyncOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#818CF8]/15 hover:bg-[#818CF8]/25 border border-[#818CF8]/30 rounded-full text-xs sm:text-sm font-semibold text-[#818CF8] transition-all hover:scale-105 cursor-pointer"
          title="Connect & sync social media servers"
        >
          <Share2 className="w-4 h-4 text-[#818CF8]" />
          <span className="hidden sm:inline">Social Sync</span>
        </button>

        {/* Create / Upload */}
        {user && (
          <Link
            to="/upload"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#161B26] hover:bg-[#1F2633] border border-white/15 rounded-full text-sm font-medium text-white transition-all hover:border-[#FF4D6D]/50"
          >
            <Upload className="w-4 h-4 text-[#FF4D6D]" />
            <span className="hidden md:inline">Upload</span>
          </Link>
        )}

        {/* Theme Palette Switcher Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-1.5 p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
            title="Choose Theme Aesthetics (Avone, Wolmart, Vegist, & more)"
          >
            <Palette className="w-5 h-5 text-[#818CF8]" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-[#161B26] border border-white/15 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00F2FE]" />
                  Theme Aesthetics
                </span>
                <span className="text-[10px] text-gray-400 font-semibold px-2 py-0.5 rounded-full bg-white/10">
                  {THEME_OPTIONS.length} Presets
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                {THEME_OPTIONS.map((opt) => {
                  const isActive = theme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setTheme(opt.id);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-white/15 border border-[#00F2FE]/50 text-white font-bold'
                          : 'hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/20"
                          style={{ backgroundColor: opt.accentColor }}
                        />
                        <span className="text-xs truncate">{opt.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-black/40 text-gray-300 flex-shrink-0 ml-1">
                        {opt.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="px-3 pt-2 border-t border-white/10 text-center">
                <Link
                  to="/settings"
                  onClick={() => setShowThemeMenu(false)}
                  className="text-[11px] text-[#818CF8] hover:underline font-semibold"
                >
                  Manage Visual Effects & Settings →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-300" />}
        </button>

        {/* Notifications */}
        {user && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-white/10 rounded-full relative transition-colors text-gray-300 hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#FF4D6D] rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#0D1117]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[#161B26] border border-white/15 rounded-2xl shadow-2xl py-2 z-50">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <span className="font-bold text-sm text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-[#818CF8] hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => {
                          markAsRead(n._id);
                          setShowNotifications(false);
                          navigate(n.link);
                        }}
                        className={`p-3.5 hover:bg-white/5 cursor-pointer transition-colors flex gap-3 ${
                          !n.isRead ? 'bg-[#FF4D6D]/5 border-l-2 border-[#FF4D6D]' : ''
                        }`}
                      >
                        {n.sender ? (
                          <img
                            src={n.sender.avatar}
                            alt={n.sender.name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#818CF8]/20 flex items-center justify-center text-[#818CF8] flex-shrink-0 font-bold">
                            N
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                          <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-gray-500 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Menu or Sign In */}
        {user ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#FF4D6D] transition-all"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover bg-gray-800"
              />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#161B26] border border-white/15 rounded-2xl shadow-2xl py-2 z-50">
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                  </div>
                </div>

                <div className="py-1 border-b border-white/10">
                  <Link
                    to={`/channel/${user._id}`}
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span>Your Profile & Channel</span>
                  </Link>
                  <Link
                    to="/studio"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                  >
                    <VideoIcon className="w-4 h-4 text-gray-400" />
                    <span>Creator Studio</span>
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                  >
                    <History className="w-4 h-4 text-gray-400" />
                    <span>Watch History</span>
                  </Link>
                </div>

                <div className="py-1 border-b border-white/10">
                  <Link
                    to="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span>Settings</span>
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#FF4D6D] hover:bg-white/10 transition-colors font-medium"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                      navigate('/home');
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-4 py-2 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white rounded-full text-sm font-semibold shadow-lg shadow-[#FF4D6D]/20 transition-all hover:scale-105"
          >
            <UserIcon className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
      </>
      )}

      {/* Real Voice Search Modal */}
      <VoiceSearchModal
        isOpen={isVoiceSearchOpen}
        onClose={() => setIsVoiceSearchOpen(false)}
        onSearchResult={handleVoiceSearchResult}
        onTranscriptChange={(text) => setSearchQuery(text)}
      />

      {/* Social Media Server Sync Modal */}
      <SocialSyncModal
        isOpen={isSocialSyncOpen}
        onClose={() => setIsSocialSyncOpen(false)}
      />
    </header>
  );
};
