import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { Home, Flame, Upload, PlaySquare, ListVideo, X } from 'lucide-react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MiniPlayer } from '../common/MiniPlayer';
import { AuthPromptModal } from '../common/AuthPromptModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, checkAuth } = useAuthStore();
  const { ambientGlow, glassOpacity } = useThemeStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Close mobile sidebar drawer on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const isWatchPage = location.pathname.startsWith('/watch/');
  const isShortsPage = location.pathname === '/shorts';
  const isLandingPage = location.pathname === '/';

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLandingPage) {
    return <Outlet />;
  }

  return (
    <div className={`min-h-screen bg-[#0D1117] text-white flex flex-col relative overflow-x-hidden glass-${glassOpacity}`}>
      {/* Ambient Atmospheric Background Glow Elements */}
      {ambientGlow && (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40 select-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-[#818CF8]/30 via-[#00F2FE]/20 to-transparent blur-3xl animate-ambient-glow" />
          <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-gradient-to-bl from-[#FF4D6D]/20 via-[#7F00FF]/20 to-transparent blur-3xl animate-ambient-glow" style={{ animationDelay: '3s' }} />
          <div className="absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] rounded-full bg-gradient-to-t from-[#10B981]/15 via-[#38BDF8]/15 to-transparent blur-3xl animate-ambient-glow" style={{ animationDelay: '5s' }} />
        </div>
      )}

      <Navbar toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          {!isWatchPage && !isShortsPage && (
            <Sidebar isOpen={isSidebarOpen} />
          )}
        </div>

        {/* Mobile Slide-Over Drawer Sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-50 flex bg-black/70 md:hidden animate-fade-in"
            onClick={() => setIsSidebarOpen(false)}
          >
            <div
              className="w-72 bg-[#0D1117] h-full shadow-2xl overflow-y-auto relative flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <span className="font-bold text-white text-base">Navigation</span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar isOpen={true} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area with padding for Mobile Bottom Bar */}
        <main
          className={`flex-1 min-w-0 overflow-x-hidden ${
            isWatchPage || isShortsPage ? 'w-full' : ''
          } ${isShortsPage ? 'pb-14 md:pb-0' : 'pb-16 md:pb-0'}`}
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D1117]/95 backdrop-blur-lg border-t border-white/10 h-14 flex items-center justify-around px-1 text-white shadow-2xl">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#FF4D6D] font-bold' : 'text-gray-400 hover:text-white'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/shorts"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#FF4D6D] font-bold' : 'text-gray-400 hover:text-white'
            }`
          }
        >
          <Flame className="w-5 h-5 mb-0.5" />
          <span>Shorts</span>
        </NavLink>

        <NavLink
          to="/upload"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#FF4D6D] font-bold' : 'text-gray-400 hover:text-white'
            }`
          }
        >
          <div className="w-8 h-8 rounded-full bg-[#FF4D6D] flex items-center justify-center text-white shadow-md shadow-[#FF4D6D]/30 mb-0.5">
            <Upload className="w-4 h-4" />
          </div>
          <span>Upload</span>
        </NavLink>

        <NavLink
          to="/subscriptions"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#FF4D6D] font-bold' : 'text-gray-400 hover:text-white'
            }`
          }
        >
          <PlaySquare className="w-5 h-5 mb-0.5" />
          <span>Subs</span>
        </NavLink>

        <NavLink
          to={user ? "/playlists" : "/login"}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 text-[10px] font-medium transition-colors ${
              isActive ? 'text-[#FF4D6D] font-bold' : 'text-gray-400 hover:text-white'
            }`
          }
        >
          <ListVideo className="w-5 h-5 mb-0.5" />
          <span>You</span>
        </NavLink>
      </nav>

      {/* Floating Mini Player */}
      <MiniPlayer />

      {/* Global Auth Prompt Modal (YouTube style) */}
      <AuthPromptModal />
    </div>
  );
};
