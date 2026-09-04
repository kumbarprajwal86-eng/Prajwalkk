import React from 'react';
import { Link } from 'react-router-dom';
import { Play, LogIn, UserPlus, X, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const AuthPromptModal: React.FC = () => {
  const { authPrompt, closeAuthPrompt } = useAuthStore();

  if (!authPrompt || !authPrompt.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#161B26] border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6 animate-scale-up">
        <button
          onClick={closeAuthPrompt}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF4D6D] to-[#818CF8] flex items-center justify-center mx-auto shadow-xl shadow-[#FF4D6D]/30">
            <Play className="w-8 h-8 text-white fill-white ml-0.5" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Sign in to Viewpoint</h2>
          <p className="text-sm text-gray-300 leading-relaxed px-2">
            {authPrompt.message || 'Join the next generation streaming community to like videos, leave comments, and subscribe to creators.'}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            to="/login"
            onClick={closeAuthPrompt}
            className="w-full py-3 px-4 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white font-bold rounded-xl shadow-lg shadow-[#FF4D6D]/30 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Your Account</span>
          </Link>

          <Link
            to="/register"
            onClick={closeAuthPrompt}
            className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/15 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
          >
            <UserPlus className="w-4 h-4 text-[#818CF8]" />
            <span>Create Free Account</span>
          </Link>
        </div>

        <div className="p-3 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1.5 font-medium text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-[#818CF8]" />
            <span>Instant Demo access available on sign in</span>
          </span>
          <button
            onClick={closeAuthPrompt}
            className="text-xs font-bold text-gray-400 hover:text-white underline ml-2"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};
