import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  Award,
  Video,
  ArrowRight,
  Flame,
  Tv
} from 'lucide-react';
import { Video as VideoType } from '../types';
import { api } from '../lib/api';
import { VideoCard } from '../components/common/VideoCard';
import { Footer } from '../components/layout/Footer';
import { useAuthStore } from '../store/useAuthStore';

export const LandingPage: React.FC = () => {
  const [trending, setTrending] = useState<VideoType[]>([]);
  const [allVideos, setAllVideos] = useState<VideoType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendRes, allRes] = await Promise.all([
          api.get('/videos/trending'),
          api.get('/videos'),
        ]);
        setTrending(trendRes.data.slice(0, 4));
        setAllVideos(allRes.data || []);
      } catch (err) {
        console.error('Failed to load landing page data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryCount = (catKey: string) => {
    if (catKey === 'Shorts') {
      return allVideos.filter((v) => Boolean(v.isShort)).length;
    }
    if (catKey === 'Music') {
      return allVideos.filter((v) => !v.isShort && (v.category === 'Music' || v.category === 'Music & LoFi')).length;
    }
    return allVideos.filter((v) => !v.isShort && v.category === catKey).length;
  };

  const categoriesShowcase = [
    { name: 'Gaming', categoryKey: 'Gaming', icon: '🎮', color: 'from-purple-600/30 to-indigo-600/30 border-purple-500/30' },
    { name: 'Technology', categoryKey: 'Technology', icon: '💻', color: 'from-blue-600/30 to-cyan-600/30 border-blue-500/30' },
    { name: 'Music & LoFi', categoryKey: 'Music', icon: '🎧', color: 'from-pink-600/30 to-rose-600/30 border-pink-500/30' },
    { name: 'Education', categoryKey: 'Education', icon: '🚀', color: 'from-emerald-600/30 to-teal-600/30 border-emerald-500/30' },
    { name: 'Sports', categoryKey: 'Sports', icon: '🏆', color: 'from-amber-600/30 to-yellow-600/30 border-amber-500/30' },
    { name: 'News', categoryKey: 'News', icon: '📰', color: 'from-sky-600/30 to-blue-600/30 border-sky-500/30' },
    { name: 'Fashion', categoryKey: 'Fashion', icon: '✨', color: 'from-fuchsia-600/30 to-pink-600/30 border-fuchsia-500/30' },
    { name: 'Movies', categoryKey: 'Movies', icon: '🎬', color: 'from-violet-600/30 to-purple-600/30 border-violet-500/30' },
    { name: 'Shorts', categoryKey: 'Shorts', icon: '⚡', color: 'from-orange-600/30 to-amber-600/30 border-orange-500/30' },
  ];

  const features = [
    {
      icon: Zap,
      title: 'Ultra-Fast 4K & 60FPS Streaming',
      desc: 'Powered by edge-distributed CDN architectures and adaptive bitrate engines for zero-buffer playback.',
      color: 'text-[#FF4D6D]',
      bg: 'bg-[#FF4D6D]/10',
    },
    {
      icon: Sparkles,
      title: 'Gemini AI Recommendation Engine',
      desc: 'Next-generation semantic topic modeling that discovers the exact tutorials, beats, and live streams you love.',
      color: 'text-[#818CF8]',
      bg: 'bg-[#818CF8]/10',
    },
    {
      icon: ShieldCheck,
      title: 'Creator-First Monetization',
      desc: 'Transparent analytics, instant revenue splits, and built-in channel memberships and collaborative playlists.',
      color: 'text-[#00C853]',
      bg: 'bg-[#00C853]/10',
    },
    {
      icon: Tv,
      title: 'Theater & Mini Picture-in-Picture',
      desc: 'Never stop watching with our background mini-player, dark theater mode, and responsive mobile layouts.',
      color: 'text-[#FFD600]',
      bg: 'bg-[#FFD600]/10',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0D1117] text-white overflow-x-hidden selection:bg-[#FF4D6D]/30">
      {/* Navbar Minimal for Landing */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/10">
        <Link to={user ? "/home" : "/"} className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-[#FF4D6D] flex items-center justify-center shadow-lg shadow-[#FF4D6D]/40 group-hover:scale-105 transition-transform">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
            VIEW<span className="text-[#FF4D6D]">POINT</span>
            <span className="text-xs font-bold px-2 py-0.5 bg-white/10 rounded-full text-[#818CF8] border border-white/10 ml-2">
              SaaS PRO
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to={user ? "/home" : "/login"}
            className="text-sm font-semibold text-gray-300 hover:text-white transition-colors hidden sm:block"
          >
            Explore App
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-bold transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white rounded-full text-sm font-bold shadow-lg shadow-[#FF4D6D]/30 transition-all hover:scale-105"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF4D6D]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-[#818CF8]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs font-bold text-[#818CF8] animate-pulse shadow-inner">
            <Sparkles className="w-4 h-4" />
            <span>THE NEXT GENERATION OF HIGH-DEFINITION STREAMING</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Watch, Create, and Connect <br className="hidden sm:block" />
            in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D6D] via-[#FF4D4D] to-[#818CF8]">True 4K Resolution</span>.
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 font-normal leading-relaxed">
            Experience VIEWPOINT—the modern, lightning-fast video platform crafted with cutting-edge AI recommendations, real-time analytics, and a pristine dark glassmorphism interface.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-4 bg-[#161B26] hover:bg-[#1F2633] text-white font-bold rounded-2xl border border-white/15 flex items-center justify-center gap-3 text-base transition-all hover:border-white/40"
            >
              <Video className="w-5 h-5 text-[#818CF8]" />
              <span>Launch Creator Channel</span>
            </button>
          </div>

          {/* Quick stats badge */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-white/10">
            <div>
              <p className="text-3xl font-black text-white">0</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Monthly Streams</p>
            </div>
            <div>
              <p className="text-3xl font-black text-[#818CF8]">0ms</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Avg CDN Latency</p>
            </div>
            <div>
              <p className="text-3xl font-black text-[#00C853]">0 / 0 FPS</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Ultra HD Playback</p>
            </div>
            <div>
              <p className="text-3xl font-black text-[#FFD600]">0 / 0</p>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">AI Recommendation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section Showcase */}
      <section className="py-20 px-6 bg-[#10141D] border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 text-[#FF4D6D] font-bold text-sm uppercase tracking-wider mb-2">
                <Flame className="w-4 h-4 fill-[#FF4D6D]" />
                <span>Trending Worldwide</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Featured High-Definition Streams</h2>
            </div>
            <Link
              to={user ? "/home?category=Trending" : "/login"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-sm font-semibold text-white transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Loading featured videos...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trending.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Explore Rich Video Ecosystems</h2>
          <p className="text-gray-400">From high-frequency competitive gaming speedruns to deep-dive AI engineering masterclasses, VIEWPOINT hosts creators across every discipline.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categoriesShowcase.map((cat) => {
            const count = getCategoryCount(cat.categoryKey);
            const countText =
              cat.categoryKey === 'Shorts'
                ? `${count} ${count === 1 ? 'Short' : 'Shorts'}`
                : `${count} ${count === 1 ? 'Video' : 'Videos'}`;

            return (
              <div
                key={cat.name}
                onClick={() =>
                  navigate(user ? `/home?category=${cat.categoryKey}` : '/login')
                }
                className={`p-5 rounded-2xl bg-gradient-to-br ${cat.color} border backdrop-blur-sm cursor-pointer hover:scale-105 transition-all text-center group shadow-md`}
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                <p className="text-xs font-semibold text-gray-300 mt-1">
                  {countText}
                </p>
              </div>
            );
          })}
        </div>
      </section>



      {/* Features SaaS Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-white uppercase tracking-wider">
            <Award className="w-4 h-4 text-[#FFD600]" />
            <span>Built for Modern Scale</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Why VIEWPOINT Stands Out</h2>
          <p className="text-gray-400 text-base">Engineered from the ground up with clean TypeScript, reactive TanStack patterns, and robust video delivery systems.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-[#161B26]/60 hover:bg-[#161B26] border border-white/10 transition-all flex gap-6 items-start shadow-xl"
              >
                <div className={`p-4 rounded-2xl ${f.bg} ${f.color} flex-shrink-0`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center">
        <div className="p-12 sm:p-16 rounded-3xl bg-gradient-to-r from-[#FF4D6D]/20 via-[#161B26] to-[#818CF8]/20 border border-white/15 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Ready to Dive into VIEWPOINT?
            </h2>
            <p className="text-gray-300 max-w-xl mx-auto text-base">
              Join thousands of creators and millions of viewers today. Start watching in seconds or launch your own video channel for free.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={() => navigate(user ? '/home' : '/login')}
                className="px-8 py-4 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white font-bold rounded-full shadow-lg shadow-[#FF4D6D]/40 transition-all hover:scale-105"
              >
                Launch Application
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
