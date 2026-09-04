import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Mail, Lock, User as UserIcon, AtSign, AlertCircle, CheckCircle2, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { AvatarPicker } from '../components/common/AvatarPicker';
import { GoogleSignInModal } from '../components/common/GoogleSignInModal';

export const RegisterPage: React.FC = () => {
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'user' | 'creator'>('creator');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, error, clearSuggestSignup } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    if (urlEmail && !email) {
      setEmail(urlEmail);
      if (!username) {
        setUsername(urlEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''));
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;
    setIsSubmitting(true);
    try {
      const rawUser = (username || name.split(' ')[0] || email.split('@')[0] || 'user').toLowerCase().replace(/[^a-zA-Z0-9_.\-]/g, '');
      const validUsername = rawUser.length >= 3 ? rawUser : (rawUser + '123').slice(0, 15);

      await register({
        name: name.trim(),
        email: email.trim(),
        username: validUsername,
        password,
        role,
        avatar: avatar || `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80`,
      });
      clearSuggestSignup();
      navigate('/home');
    } catch (err) {
      // handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmailTaken = error && error.toLowerCase().includes('already registered');

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
          <h2 className="text-xl font-bold text-white pt-2">Create Free Account</h2>
          <p className="text-xs text-gray-400">Join the next generation high-definition video streaming ecosystem.</p>
        </div>

        {/* Auth Mode Toggle Bar */}
        <div className="grid grid-cols-2 p-1 bg-black/50 rounded-2xl border border-white/10 text-xs font-bold">
          <Link
            to={`/login${email ? `?email=${encodeURIComponent(email)}` : ''}`}
            onClick={clearSuggestSignup}
            className="py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In Details</span>
          </Link>
          <button
            type="button"
            className="py-2.5 rounded-xl bg-[#FF4D6D] text-white shadow font-extrabold flex items-center justify-center gap-1.5 cursor-default"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create New Account</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-[#FF4D6D]/15 border border-[#FF4D6D] rounded-2xl text-xs text-[#FF4D6D] space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            {isEmailTaken && (
              <Link
                to={`/login?email=${encodeURIComponent(email)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FF4D6D] text-white rounded-xl font-bold shadow hover:bg-[#FF4D6D]/90 transition-colors w-full justify-center mt-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in with {email} instead</span>
              </Link>
            )}
          </div>
        )}

        {/* Account Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setRole('creator')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              role === 'creator' ? 'bg-[#FF4D6D] text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>🎬 Creator Channel</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('user')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              role === 'user' ? 'bg-[#818CF8] text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>👀 Viewer Account</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Full Name or Channel Title
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Alex Rivera or TechPulse HD"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!username) {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                  }
                }}
                className="w-full bg-black/40 border border-white/20 focus:border-[#818CF8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Channel Handle / Username
            </label>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="techpulsehd"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_.\-]/g, ''))}
                className="w-full bg-black/40 border border-white/20 focus:border-[#818CF8] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/20 focus:border-[#818CF8] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none transition-colors"
                required
                minLength={6}
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

          <AvatarPicker
            currentAvatar={avatar}
            onSelectAvatar={setAvatar}
            label="Choose Creator Profile Photo"
            className="pt-2 border-t border-white/10"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-[#FF4D6D]/30 transition-transform hover:scale-[1.02] text-sm mt-2 flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? 'Creating Account...' : 'Register & Launch'}</span>
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Or create with</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          className="w-full py-2.5 bg-white text-black hover:bg-gray-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow transition-colors"
        >
          <span className="text-base font-black">G</span>
          <span>Sign up with Google (Choose Gmail Account)</span>
        </button>

        <p className="text-center text-xs text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-[#818CF8] font-bold hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};
