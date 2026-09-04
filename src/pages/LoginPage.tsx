import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Mail, Lock, LogIn, AlertCircle, Sparkles, CheckCircle2, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { GoogleSignInModal } from '../components/common/GoogleSignInModal';

export const LoginPage: React.FC = () => {
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const { login, googleLogin, error, suggestSignupEmail, clearSuggestSignup } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setForgotMsg('');
    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      // error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setIsSubmitting(true);
    setForgotMsg('');
    try {
      await login(demoEmail, 'password123');
      navigate('/home');
    } catch (err) {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateGoogle = () => {
    setShowGoogleModal(true);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 bg-[#0D1117]">
      <GoogleSignInModal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} />
      <div className="w-full max-w-md bg-[#161B26] border border-white/15 rounded-3xl p-8 shadow-2xl space-y-6 animate-slide-up">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF4D6D] flex items-center justify-center shadow-lg shadow-[#FF4D6D]/40">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              VIEW<span className="text-[#FF4D6D]">POINT</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white pt-2">Sign In Details</h2>
          <p className="text-xs text-gray-400">Enter your sign in details below or switch to create a new free account.</p>
        </div>

        {/* Auth Mode Toggle Bar */}
        <div className="grid grid-cols-2 p-1 bg-black/50 rounded-2xl border border-white/10 text-xs font-bold">
          <button
            type="button"
            className="py-2.5 rounded-xl bg-[#FF4D6D] text-white shadow font-extrabold flex items-center justify-center gap-1.5 cursor-default"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In Details</span>
          </button>
          <Link
            to={`/register${email ? `?email=${encodeURIComponent(email)}` : ''}`}
            onClick={clearSuggestSignup}
            className="py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create New Account</span>
          </Link>
        </div>

        {/* Account Not Found Suggestion Banner (YouTube / Google style) */}
        {suggestSignupEmail && (
          <div className="p-5 bg-gradient-to-r from-[#818CF8]/20 to-[#FF4D6D]/20 border border-[#818CF8]/50 rounded-2xl space-y-3 animate-fade-in shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#818CF8]/20 rounded-xl text-[#818CF8] flex-shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white">No account found with "{suggestSignupEmail}"</h3>
                <p className="text-xs text-gray-300 mt-0.5">
                  We couldn't find a Viewpoint account connected to this email or username. It only takes 30 seconds to join!
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Link
                to={`/register?email=${encodeURIComponent(suggestSignupEmail)}`}
                onClick={clearSuggestSignup}
                className="flex-1 py-2 px-4 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform hover:scale-[1.02]"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sign Up with {suggestSignupEmail}</span>
              </Link>
              <button
                type="button"
                onClick={clearSuggestSignup}
                className="py-2 px-3 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Try different email
              </button>
            </div>
          </div>
        )}

        {error && !suggestSignupEmail && (
          <div className="p-3 bg-[#FF4D6D]/15 border border-[#FF4D6D] rounded-2xl text-xs text-[#FF4D6D] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {forgotMsg && (
          <div className="p-3 bg-[#818CF8]/15 border border-[#818CF8] rounded-2xl text-xs text-[#818CF8] flex items-center gap-2">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{forgotMsg}</span>
          </div>
        )}

        {/* Quick Demo Login Buttons */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#818CF8] uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Demo Accounts</span>
            </span>
            <span>No typing needed</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoLogin('alex@viewpoint.com')}
              disabled={isSubmitting}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-left transition-colors"
            >
              <p className="text-xs font-bold text-white truncate">Alex Rivera</p>
              <p className="text-[10px] text-gray-400">Creator PRO</p>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@viewpoint.com')}
              disabled={isSubmitting}
              className="p-2 bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 border border-[#FF4D6D]/30 rounded-xl text-left transition-colors"
            >
              <p className="text-xs font-bold text-[#FF4D6D] truncate">Admin Panel</p>
              <p className="text-[10px] text-gray-400">Moderator & Root</p>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Email Address or Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="name@example.com or username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (suggestSignupEmail) clearSuggestSignup();
                }}
                className="w-full bg-black/40 border border-white/20 focus:border-[#818CF8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/20 focus:border-[#818CF8] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-[#FF4D6D]"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setForgotMsg("For demo accounts, use password 'password123' or 'admin123'. Or create a new free account!");
              }}
              className="text-[#818CF8] hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-[#FF4D6D]/30 transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 text-sm mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-xs text-gray-500 uppercase tracking-widest font-semibold">Or continue with</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          type="button"
          onClick={handleSimulateGoogle}
          disabled={isSubmitting}
          className="w-full py-2.5 bg-white text-black hover:bg-gray-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow transition-colors"
        >
          <span className="text-base font-black">G</span>
          <span>Sign in with Google (Choose Gmail Account)</span>
        </button>

        <p className="text-center text-xs text-gray-400">
          Don't have an account?{' '}
          <Link
            to={`/register${email ? `?email=${encodeURIComponent(email)}` : ''}`}
            onClick={clearSuggestSignup}
            className="text-[#818CF8] font-bold hover:underline"
          >
            Register free account
          </Link>
        </p>
      </div>
    </div>
  );
};
