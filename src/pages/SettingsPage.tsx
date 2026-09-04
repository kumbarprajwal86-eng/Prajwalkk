import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  SunDim,
  Tv,
  Play,
  Volume2,
  Shield,
  Bell,
  User as UserIcon,
  LogOut,
  Trash2,
  Check,
  Zap,
  Globe,
  Edit3,
  Save,
  Palette,
  Sparkles,
  CheckCircle2,
  Terminal,
  Compass
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore, THEME_OPTIONS } from '../store/useThemeStore';
import { AvatarPicker } from '../components/common/AvatarPicker';
import { api } from '../lib/api';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuthStore();
  const {
    theme,
    setTheme,
    ambientGlow,
    toggleAmbientGlow,
    glassOpacity,
    setGlassOpacity,
    theaterMode,
    toggleTheaterMode,
    autoPlay,
    toggleAutoPlay,
    playbackSpeed,
    setPlaybackSpeed,
    quality,
    setQuality,
    historyPaused,
    toggleHistoryPaused
  } = useThemeStore();

  const navigate = useNavigate();
  const [savedMessage, setSavedMessage] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const handleSaveSettings = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleSavePhoto = async () => {
    if (!avatar) return;
    setIsSavingPhoto(true);
    try {
      await updateProfile({ avatar });
      setIsEditingPhoto(false);
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err) {
      alert('Failed to update profile photo.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete your account? This will remove all your uploaded videos, comments, playlists, and watch history. This cannot be undone.')) return;
    try {
      await api.delete('/users/profile');
      await logout();
      alert('Your account has been permanently deleted.');
      navigate('/register');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete account.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-[#818CF8]" />
            <span>Platform Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Customize your playback experience, theme preferences, and account security.
          </p>
        </div>

        {savedMessage && (
          <div className="px-4 py-2 bg-[#00C853] text-white font-bold text-xs rounded-full flex items-center gap-1.5 shadow-lg animate-bounce">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Preferences Saved!</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Section 0: Account Admin & Profile Photo */}
        {user && (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#161B26] to-[#1F2633] border border-[#818CF8]/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-[#818CF8]" />
                <span>Account & Creator Profile Image</span>
              </h3>
              <button
                onClick={() => {
                  setAvatar(user.avatar);
                  setIsEditingPhoto(!isEditingPhoto);
                }}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingPhoto ? 'Cancel' : 'Change Profile Photo'}</span>
              </button>
            </div>

            {!isEditingPhoto ? (
              <div className="flex items-center gap-4 py-2">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-[#818CF8] shadow-lg bg-gray-900"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-white">{user.name}</span>
                    <span className="px-2 py-0.5 bg-[#818CF8]/20 text-[#818CF8] text-[10px] font-extrabold uppercase rounded-full">
                      {user.role === 'admin' ? 'Root Admin' : user.role === 'creator' ? 'Creator' : 'Viewer'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">@{user.username} • {user.email}</p>
                  <p className="text-xs text-[#00C853] font-medium flex items-center gap-1 pt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Active Profile Photo synced across videos and comments</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2 animate-fade-in">
                <AvatarPicker
                  currentAvatar={avatar}
                  onSelectAvatar={setAvatar}
                  label="Select or Upload New Profile Image"
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingPhoto(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePhoto}
                    disabled={isSavingPhoto}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#00C853] hover:bg-[#00C853]/90 text-white flex items-center gap-1.5 shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingPhoto ? 'Saving...' : 'Save Profile Photo'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 1: Appearance & Theme Presets */}
        <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#818CF8]" />
              <span>Platform Theme & Visual Aesthetics</span>
            </h3>
            <span className="text-xs font-semibold px-3 py-1 bg-[#818CF8]/15 text-[#818CF8] border border-[#818CF8]/30 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#00F2FE]" />
              <span>{THEME_OPTIONS.length} Dynamic Themes</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-gray-300">
            Select your preferred custom theme palette. The chosen theme will instantly apply across the entire application including video players, cards, navigation, and studio components.
          </p>

          {/* Theme Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {THEME_OPTIONS.map((opt) => {
              const isActive = theme === opt.id;
              
              const renderSymbolIcon = (sizeClass = "w-4 h-4") => {
                switch (opt.iconName) {
                  case 'sparkles':
                    return <Sparkles className={sizeClass} />;
                  case 'zap':
                    return <Zap className={sizeClass} />;
                  case 'terminal':
                    return <Terminal className={sizeClass} />;
                  case 'compass':
                    return <Compass className={sizeClass} />;
                  case 'moon':
                    return <Moon className={sizeClass} />;
                  case 'sun-medium':
                    return <SunDim className={sizeClass} />;
                  case 'moon-star':
                    return <Moon className={sizeClass} />;
                  case 'sun':
                    return <Sun className={sizeClass} />;
                  default:
                    return <Palette className={sizeClass} />;
                }
              };

              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    handleSaveSettings();
                  }}
                  className={`relative p-4 rounded-2xl border text-left transition-all group overflow-hidden ${
                    isActive
                      ? 'border-[#00F2FE] bg-white/10 ring-2 ring-[#00F2FE]/40 shadow-xl scale-[1.02]'
                      : 'border-white/10 bg-black/30 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  {/* Top Bar Preview with Theme Icon */}
                  <div
                    className="h-12 rounded-xl mb-3 p-2.5 flex items-center justify-between border border-white/10 shadow-inner relative overflow-hidden"
                    style={{ backgroundColor: opt.previewBg }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: opt.accentColor }}
                      >
                        {renderSymbolIcon("w-4 h-4")}
                      </div>
                      <div
                        className="w-14 h-3.5 rounded-md border border-white/10"
                        style={{ backgroundColor: opt.previewCard }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: opt.previewAccent }}
                      />
                      <div
                        className="w-7 h-3 rounded-full opacity-80"
                        style={{ backgroundColor: opt.accentColor }}
                      />
                    </div>
                  </div>

                  {/* Header & Badge */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span className="p-1 rounded bg-white/10 text-gray-200">
                        {renderSymbolIcon("w-3.5 h-3.5")}
                      </span>
                      {opt.name}
                      {opt.isFuturistic && (
                        <Sparkles className="w-3.5 h-3.5 text-[#00F2FE] inline-block" />
                      )}
                    </span>
                    {isActive ? (
                      <span className="p-1 bg-[#00C853] text-white rounded-full">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-gray-300">
                        {opt.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {opt.description}
                  </p>

                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${opt.bgGradient}`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Visual Effects & Aesthetics Controls */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#818CF8]">Visual Aesthetics & Atmospheric Polish</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ambient Glow */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#00F2FE]" />
                    <span>Ambient Background Glow</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Atmospheric colored lighting behind page headers & video cards</p>
                </div>
                <button
                  onClick={() => {
                    toggleAmbientGlow();
                    handleSaveSettings();
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    ambientGlow ? 'bg-[#00F2FE]/20 text-[#00F2FE] border-[#00F2FE]/50 shadow-md' : 'bg-white/10 text-gray-400 border-white/20'
                  }`}
                >
                  {ambientGlow ? 'Glow ON' : 'Glow OFF'}
                </button>
              </div>

              {/* Glassmorphism Blur Level */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-[#FF4D6D]" />
                  <span>Glassmorphism Blur Density</span>
                </p>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {(['high', 'medium', 'minimal'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        setGlassOpacity(level);
                        handleSaveSettings();
                      }}
                      className={`py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all border ${
                        glassOpacity === level
                          ? 'bg-[#818CF8] text-white border-[#818CF8] shadow'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-white/5 pt-3">
              <div>
                <p className="text-sm font-bold text-white">Default Theater Mode</p>
                <p className="text-xs text-gray-400 mt-0.5">Expand video players to wide aspect ratios across desktop watch pages</p>
              </div>
              <button
                onClick={toggleTheaterMode}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
                  theaterMode ? 'bg-[#FFD600] text-black border-[#FFD600]' : 'bg-white/10 text-gray-300 border-white/20'
                }`}
              >
                <Tv className="w-4 h-4" />
                <span>{theaterMode ? 'Theater Enabled' : 'Standard 16:9'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Video Playback & Quality */}
        <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
            <Play className="w-5 h-5 text-[#FF4D6D]" />
            <span>Video Playback & Quality</span>
          </h3>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-bold text-white">AutoPlay Next Video</p>
              <p className="text-xs text-gray-400 mt-0.5">Automatically stream recommended videos after playback concludes</p>
            </div>
            <button
              onClick={toggleAutoPlay}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                autoPlay ? 'bg-[#00C853] text-white border-[#00C853]' : 'bg-white/10 text-gray-400 border-white/20'
              }`}
            >
              <span>{autoPlay ? 'AutoPlay ON' : 'AutoPlay OFF'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-white/5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Default Playback Speed</label>
              <select
                value={playbackSpeed}
                onChange={(e) => {
                  setPlaybackSpeed(parseFloat(e.target.value));
                  handleSaveSettings();
                }}
                className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#818CF8]"
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                  <option key={spd} value={spd}>
                    {spd === 1 ? '1.0x Normal Speed' : `${spd}x Speed`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Default Streaming Quality</label>
              <select
                value={quality}
                onChange={(e) => {
                  setQuality(e.target.value);
                  handleSaveSettings();
                }}
                className="w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#818CF8]"
              >
                {['1080p60 HD', '720p60 HD', '480p', '360p'].map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Privacy & Watch History */}
        <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
            <Shield className="w-5 h-5 text-[#00C853]" />
            <span>Privacy & History</span>
          </h3>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-bold text-white">Pause Watch History Logging</p>
              <p className="text-xs text-gray-400 mt-0.5">Stop saving newly streamed videos to your account history</p>
            </div>
            <button
              onClick={toggleHistoryPaused}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                historyPaused ? 'bg-[#FFD600] text-black font-extrabold border-[#FFD600]' : 'bg-white/10 text-gray-300 border-white/20'
              }`}
            >
              <span>{historyPaused ? 'History Paused' : 'History Active'}</span>
            </button>
          </div>
        </div>

        {/* Section 4: Account Information */}
        <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
            <UserIcon className="w-5 h-5 text-gray-400" />
            <span>Account Security & Session</span>
          </h3>

          {user ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-4">
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-bold text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email} • Role: <span className="uppercase font-bold text-[#818CF8]">{user.role}</span></p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/profile')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-[#FF4D6D]/20 hover:bg-[#FF4D6D]/30 text-[#FF4D6D] border border-[#FF4D6D]/30 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4 text-[#FF4D6D]" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between py-2">
              <p className="text-sm text-gray-300">You are currently in guest mode.</p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-[#FF4D6D] text-white font-bold rounded-full text-xs"
              >
                Sign In Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
