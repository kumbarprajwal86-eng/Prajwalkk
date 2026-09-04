import React, { useState } from 'react';
import { X, Check, Mail, User, ShieldCheck, Sparkles, Plus, ArrowRight, Github } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_GMAIL_ACCOUNTS = [
  {
    name: 'Prajwal K',
    email: 'kumbarprajwal86@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    role: 'Root Admin & Creator',
    badge: 'Your Gmail',
  },
  {
    name: 'Elena Rostova',
    email: 'elena.creator@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    role: 'Verified Tech Creator',
    badge: 'Creator Pro',
  },
  {
    name: 'Alex Turner',
    email: 'alex.viewer@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    role: 'Premium Stream Viewer',
    badge: 'Viewer',
  },
];

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState<'google' | 'github'>('google');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { googleLogin, githubLogin } = useAuthStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSelectAccount = async (email: string, name: string, avatar?: string) => {
    setIsSubmitting(true);
    setError('');
    try {
      await googleLogin(email, name, avatar);
      onClose();
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const handle = githubUsername.trim() || 'kumbarprajwal86';
    setIsSubmitting(true);
    setError('');
    try {
      await githubLogin(handle, `${handle}@users.noreply.github.com`, handle, `https://avatars.githubusercontent.com/${handle}`);
      onClose();
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'GitHub authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customName.trim()) {
      setError('Please provide both Gmail address and your name.');
      return;
    }
    if (!customEmail.toLowerCase().includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    await handleSelectAccount(customEmail.trim(), customName.trim());
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#161B26] border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Modal Header & Provider Switch */}
        <div className="bg-white p-5 text-center border-b border-gray-200 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => { setProvider('google'); setError(''); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                provider === 'google' ? 'bg-[#4285F4] text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => { setProvider('github'); setError(''); }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                provider === 'github' ? 'bg-[#24292F] text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </button>
          </div>

          {provider === 'google' ? (
            <>
              <h3 className="text-base font-bold text-gray-800">Sign in with Google</h3>
              <p className="text-xs text-gray-500 mt-0.5">Choose a Gmail account to continue to ViewPoint</p>
            </>
          ) : (
            <>
              <h3 className="text-base font-bold text-gray-800 flex items-center justify-center gap-2">
                <Github className="w-5 h-5 text-black" />
                <span>Connect with GitHub</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Authorize your GitHub Developer Account</p>
            </>
          )}
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D] text-xs font-bold text-[#FF4D6D]">
              ⚠️ {error}
            </div>
          )}

          {provider === 'github' ? (
            <form onSubmit={handleGithubSubmit} className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <Github className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">GitHub Account Sync</h4>
                    <p className="text-xs text-gray-400">Sign in using your GitHub handle</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">GitHub Username or Handle</label>
                  <input
                    type="text"
                    placeholder="e.g. kumbarprajwal86"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 focus:border-[#818CF8] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-400">Default handle: kumbarprajwal86</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#24292F] hover:bg-black text-white font-bold text-xs rounded-xl shadow-lg border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Github className="w-4 h-4" />
                <span>{isSubmitting ? 'Connecting...' : 'Authorize & Connect GitHub'}</span>
              </button>
            </form>
          ) : !showCustomInput ? (
            <>
              <div className="space-y-2.5">
                {PRESET_GMAIL_ACCOUNTS.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectAccount(acc.email, acc.name, acc.avatar)}
                    className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-black/40 hover:bg-black/70 border border-white/10 hover:border-[#818CF8] transition-all text-left group"
                  >
                    <img src={acc.avatar} alt={acc.name} className="w-11 h-11 rounded-full object-cover border border-white/20 group-hover:scale-105 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-[#818CF8] transition-colors truncate">{acc.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#818CF8]/20 text-[#818CF8] uppercase tracking-wider flex-shrink-0">
                          {acc.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{acc.email}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{acc.role}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-xs font-bold text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4 text-[#FF4D6D]" />
                <span>Use another Gmail address...</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 focus:border-[#818CF8] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">Gmail Address</label>
                <input
                  type="email"
                  placeholder="e.g. john.doe@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 focus:border-[#818CF8] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Back to List
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#4285F4] hover:bg-[#4285F4]/90 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{isSubmitting ? 'Signing In...' : 'Continue with Gmail'}</span>
                </button>
              </div>
            </form>
          )}

          <div className="pt-3 border-t border-white/10 text-center">
            <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00C853]" />
              <span>Instant Gmail Security Notification & Account Verification</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
