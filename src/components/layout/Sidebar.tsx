import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Compass,
  PlaySquare,
  History,
  ListVideo,
  ThumbsUp,
  Download,
  Video,
  Clock,
  TrendingUp,
  Gamepad2,
  Music,
  Trophy,
  Newspaper,
  GraduationCap,
  Shirt,
  Cpu,
  Film,
  Settings,
  ShieldAlert,
  Flame,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface SidebarProps {
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user } = useAuthStore();

  const mainLinks = [
    { name: 'Home', icon: Home, path: '/home' },
    { name: 'Shorts', icon: Flame, path: '/shorts', badge: 'NEW' },
    { name: 'Subscriptions', icon: PlaySquare, path: '/subscriptions' },
  ];

  const libraryLinks = [
    { name: 'History', icon: History, path: '/history' },
    { name: 'Playlists', icon: ListVideo, path: '/playlists' },
    { name: 'Watch Later', icon: Clock, path: '/playlists?tab=watch-later' },
    { name: 'Liked Videos', icon: ThumbsUp, path: '/playlists?tab=liked' },
    { name: 'Your Videos', icon: Video, path: '/studio' },
    { name: 'Downloads', icon: Download, path: '/playlists?tab=downloads' },
  ];

  const exploreLinks = [
    { name: 'Trending', icon: TrendingUp, path: '/home?category=Trending' },
    { name: 'Gaming', icon: Gamepad2, path: '/home?category=Gaming' },
    { name: 'Music', icon: Music, path: '/home?category=Music' },
    { name: 'Technology', icon: Cpu, path: '/home?category=Technology' },
    { name: 'Education', icon: GraduationCap, path: '/home?category=Education' },
    { name: 'Sports', icon: Trophy, path: '/home?category=Sports' },
    { name: 'News', icon: Newspaper, path: '/home?category=News' },
    { name: 'Fashion', icon: Shirt, path: '/home?category=Fashion' },
    { name: 'Movies', icon: Film, path: '/home?category=Movies' },
  ];

  // Collapsed view (icons only) when !isOpen on desktop
  if (!isOpen) {
    return (
      <aside className="w-20 hidden md:flex flex-col items-center py-4 bg-[#0D1117] border-r border-white/10 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto z-30 flex-shrink-0 gap-6">
        {[...mainLinks, { name: 'Library', icon: ListVideo, path: '/playlists' }].map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-16 py-2.5 rounded-xl text-[11px] font-medium transition-all ${
                  isActive ? 'text-[#FF4D6D] bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-1.5" />
              <span className="truncate w-full text-center">{item.name}</span>
            </NavLink>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-[#0D1117] border-r border-white/10 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto z-30 flex-shrink-0 px-3 py-4 flex flex-col justify-between">
      <div>
        {/* Main Section */}
        <div className="space-y-1 mb-6">
          {mainLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#FF4D6D] text-white shadow-lg shadow-[#FF4D6D]/20 font-bold'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-4">
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-[#FF4D6D] text-white text-[10px] font-bold rounded-md animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Library Section */}
        <div className="border-t border-white/10 pt-4 mb-6">
          <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">You</p>
          <div className="space-y-1">
            {libraryLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 text-gray-400" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Explore Section */}
        <div className="border-t border-white/10 pt-4 mb-6">
          <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Explore</p>
          <div className="space-y-1">
            {exploreLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <span>{item.name}</span>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Settings & Admin */}
        <div className="border-t border-white/10 pt-4 mb-6 space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Settings className="w-5 h-5 text-gray-400" />
            <span>Settings</span>
          </NavLink>

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/40' : 'text-[#FF4D6D] hover:bg-[#FF4D6D]/10'
                }`
              }
            >
              <ShieldAlert className="w-5 h-5" />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </div>
      </div>

      {/* Footer copyright */}
      <div className="px-4 pt-4 border-t border-white/10 text-[11px] text-gray-500 space-y-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="#" className="hover:text-gray-300">About</a>
          <a href="#" className="hover:text-gray-300">Press</a>
          <a href="#" className="hover:text-gray-300">Copyright</a>
          <a href="#" className="hover:text-gray-300">Creators</a>
          <a href="#" className="hover:text-gray-300">Advertise</a>
        </div>
        <p>© 2026 VIEWPOINT LLC. Next-Gen Video SaaS.</p>
      </div>
    </aside>
  );
};
