import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lightbulb,
  FileText,
  Copy,
  Check,
  Zap,
  Tag,
  Image as ImageIcon,
  Play,
  Volume2,
  Share2,
  TrendingUp,
  ArrowRight,
  Clock,
  Layers,
  Wand2
} from 'lucide-react';
import { api } from '../../lib/api';

interface ScriptSegment {
  timecode: string;
  stage: string;
  visuals: string;
  script: string;
}

interface ThumbnailIdea {
  concept: string;
  description: string;
  textOverlay: string;
  colorPalette: string;
}

interface ScriptResult {
  titles: string[];
  viralScore: number;
  hookStrengthSummary: string;
  scriptOutline: ScriptSegment[];
  thumbnailIdeas: ThumbnailIdea[];
  tags: string[];
}

export const AIScriptGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('Technology');
  const [tone, setTone] = useState('Viral & Energetic');
  const [duration, setDuration] = useState('8-10 minutes');
  const [targetAudience, setTargetAudience] = useState('General Creators & Viewers');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [activeSpeechIndex, setActiveSpeechIndex] = useState<number | null>(null);

  const quickTopics = [
    'Build a $10k SaaS with AI in 30 Days',
    'Top 10 Hidden Tech Features in 2026',
    'Why Quantum AI is Changing Everything',
    'Complete Beginner Guide to Web Development',
    '24 Hours Living Like a Millionaire'
  ];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/ai/generate-script-idea', {
        topic,
        category,
        tone,
        duration,
        targetAudience
      });
      setResult(res.data);
    } catch (err) {
      console.error('Failed to generate script & ideas', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSpeech = (text: string, index: number) => {
    if ('speechSynthesis' in window) {
      if (activeSpeechIndex === index) {
        window.speechSynthesis.cancel();
        setActiveSpeechIndex(null);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setActiveSpeechIndex(null);
      utterance.onerror = () => setActiveSpeechIndex(null);
      setActiveSpeechIndex(index);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleExportToUpload = (selectedTitle: string) => {
    if (!result) return;
    const params = new URLSearchParams({
      title: selectedTitle,
      category,
      tags: result.tags.join(',')
    });
    navigate(`/upload?${params.toString()}`);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Intro Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#FF4D6D]/15 via-[#818CF8]/15 to-purple-600/15 border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Wand2 className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF4D6D]/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini AI Producer Studio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Viral Video Script & Idea Generator
          </h2>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">
            Generate viral title options, full structured scene-by-scene script outlines, high-CTR thumbnail visual concepts, and automated SEO tags in seconds using Gemini AI.
          </p>
        </div>
      </div>

      {/* Input Form Card */}
      <form onSubmit={handleGenerate} className="p-6 sm:p-8 rounded-3xl bg-[#161B26] border border-white/10 space-y-6 shadow-xl">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
            Video Topic or Core Idea <span className="text-[#FF4D6D]">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. How AI is changing video creation in 2026..."
              className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#FF4D6D] transition-colors text-sm font-medium"
              required
            />
          </div>

          {/* Quick Idea Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
              Try an idea:
            </span>
            {quickTopics.map((qt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTopic(qt)}
                className="px-3 py-1 bg-white/5 hover:bg-white/15 text-gray-300 rounded-full text-xs transition-colors border border-white/5 cursor-pointer"
              >
                {qt}
              </button>
            ))}
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#FF4D6D]"
            >
              <option value="Technology">Technology & AI</option>
              <option value="Gaming">Gaming & Esports</option>
              <option value="Education">Education & Tutorials</option>
              <option value="Entertainment">Entertainment & Vlogs</option>
              <option value="Music">Music & Audio</option>
              <option value="Business">Business & Finance</option>
              <option value="Fitness">Fitness & Health</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Video Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#FF4D6D]"
            >
              <option value="Viral & Energetic">🔥 Viral & Energetic</option>
              <option value="Educational & Deep-Dive">📚 Educational Deep-Dive</option>
              <option value="Cinematic & Dramatic">🎬 Cinematic & Dramatic</option>
              <option value="Funny & Storytelling">😂 Funny & Storytelling</option>
              <option value="Controversial & Debunking">⚡ Debunking & Controversial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Target Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#FF4D6D]"
            >
              <option value="60 Seconds Short">📱 60s Shorts Reel</option>
              <option value="3-5 minutes">⏱️ 3-5 Minutes</option>
              <option value="8-10 minutes">🎬 8-10 Minutes (Standard)</option>
              <option value="15-20 minutes">🎥 15-20 Minutes Deep Video</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Target Audience</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Developers & Tech Fans"
              className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#FF4D6D]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="w-full py-4 bg-gradient-to-r from-[#FF4D6D] to-purple-600 hover:from-[#FF4D6D]/90 hover:to-purple-600/90 disabled:opacity-50 text-white font-extrabold rounded-2xl shadow-xl shadow-[#FF4D6D]/25 flex items-center justify-center gap-3 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-base"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Architecting Viral Blueprint with Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>Generate Viral Script & Production Blueprint</span>
            </>
          )}
        </button>
      </form>

      {/* Results Display */}
      {result && (
        <div className="space-y-8 animate-fadeIn">
          {/* Viral Score Banner */}
          <div className="p-6 rounded-3xl bg-black/50 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF4D6D] to-yellow-500 flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-[#FF4D6D]/30">
                {result.viralScore}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Viral Potential Score</span>
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </h3>
                <p className="text-xs text-gray-400 max-w-lg mt-0.5">{result.hookStrengthSummary}</p>
              </div>
            </div>

            <button
              onClick={() => handleExportToUpload(result.titles[0] || topic)}
              className="px-5 py-3 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white font-bold rounded-2xl shadow-lg shadow-[#FF4D6D]/30 flex items-center gap-2 text-sm transition-transform hover:scale-105 cursor-pointer whitespace-nowrap"
            >
              <span>Use Blueprint in Video Upload</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Section 1: Viral Title Ideas */}
          <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span>High Click-Through-Rate (CTR) Titles</span>
              </h3>
              <span className="text-xs text-gray-400">Click to copy or use</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.titles.map((t, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-black/40 border border-white/10 hover:border-[#FF4D6D]/50 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#818CF8] uppercase tracking-wider">Option #{idx + 1}</span>
                    <p className="text-sm font-bold text-white group-hover:text-[#FF4D6D] transition-colors">{t}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(t, `title-${idx}`)}
                      className="p-2 bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                      title="Copy title"
                    >
                      {copiedIndex === `title-${idx}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleExportToUpload(t)}
                      className="p-2 bg-[#FF4D6D]/20 hover:bg-[#FF4D6D]/40 text-[#FF4D6D] rounded-xl transition-colors cursor-pointer"
                      title="Use for new video upload"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Scene-By-Scene Script Outline */}
          <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#818CF8]" />
                  <span>Scene-By-Scene Production Script</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Includes visual directions, timing, and spoken script lines</p>
              </div>

              <button
                onClick={() => {
                  const fullText = result.scriptOutline.map(s => `[${s.timecode}] ${s.stage}\nVisuals: ${s.visuals}\nScript: ${s.script}\n`).join('\n');
                  copyToClipboard(fullText, 'full-script');
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                {copiedIndex === 'full-script' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedIndex === 'full-script' ? 'Copied Full Script!' : 'Copy Entire Script'}</span>
              </button>
            </div>

            <div className="space-y-4">
              {result.scriptOutline.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3 relative">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-[#818CF8]/20 text-[#818CF8] font-black rounded-lg text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {item.timecode}
                      </span>
                      <h4 className="text-sm font-bold text-white">{item.stage}</h4>
                    </div>

                    <button
                      onClick={() => handleSpeech(item.script, idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeSpeechIndex === idx ? 'bg-[#FF4D6D] text-white' : 'bg-white/5 hover:bg-white/15 text-gray-300'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{activeSpeechIndex === idx ? 'Stop Reading' : 'Listen Script'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                      <span className="font-bold text-purple-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Visual & Camera Direction
                      </span>
                      <p className="text-gray-300 leading-relaxed">{item.visuals}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                      <span className="font-bold text-emerald-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <Volume2 className="w-3 h-3" /> Spoken Dialogue / Voiceover
                      </span>
                      <p className="text-gray-200 leading-relaxed italic">"{item.script}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Thumbnail Studio Concepts */}
          <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              <span>High-CTR Thumbnail Visual Concepts</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.thumbnailIdeas.map((thumb, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400 uppercase">{thumb.concept}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-white/10 text-gray-300 rounded-full">{thumb.colorPalette}</span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">{thumb.description}</p>
                  </div>

                  {/* Mock Thumbnail Overlay Graphic Preview */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-gray-900 to-black border border-white/10 text-center space-y-1">
                    <span className="text-[9px] uppercase font-bold text-gray-500 block">Text Overlay Graphic</span>
                    <span className="text-sm font-black text-yellow-400 uppercase tracking-wider drop-shadow-md">
                      "{thumb.textOverlay}"
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Automated SEO Tags */}
          <div className="p-6 rounded-3xl bg-[#161B26] border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#FF4D6D]" />
                <span>Automated SEO Tags & Hashtags</span>
              </h3>

              <button
                onClick={() => copyToClipboard(result.tags.join(', '), 'tags')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedIndex === 'tags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 'tags' ? 'Copied Tags!' : 'Copy All Tags'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {result.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-semibold hover:border-[#FF4D6D]/50 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
