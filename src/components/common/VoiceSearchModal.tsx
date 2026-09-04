import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Loader2, Sparkles, Search, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchResult: (query: string) => void;
  onTranscriptChange?: (transcript: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({
  isOpen,
  onClose,
  onSearchResult,
  onTranscriptChange,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const autoFinishTimeoutRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');

  useEffect(() => {
    latestTranscriptRef.current = transcript;
    if (onTranscriptChange && transcript.trim()) {
      onTranscriptChange(transcript.trim());
    }
  }, [transcript, onTranscriptChange]);

  useEffect(() => {
    if (isOpen) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      clearAllTimeouts();
      stopListening();
    };
  }, [isOpen]);

  const clearAllTimeouts = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (autoFinishTimeoutRef.current) {
      clearTimeout(autoFinishTimeoutRef.current);
      autoFinishTimeoutRef.current = null;
    }
  };

  const cleanupAudioContext = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  const stopListening = () => {
    setIsListening(false);
    cleanupAudioContext();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  };

  const triggerAutoSubmit = (textToSubmit: string) => {
    const finalQuery = textToSubmit.trim();
    if (!finalQuery) return;

    setIsFinished(true);
    stopListening();

    // Small timeout so user sees the "Got it!" visual confirmation before closing
    autoFinishTimeoutRef.current = setTimeout(() => {
      onSearchResult(finalQuery);
      onClose();
    }, 600);
  };

  const startListening = async () => {
    clearAllTimeouts();
    setErrorMsg(null);
    setTranscript('');
    setIsProcessing(false);
    setIsFinished(false);
    audioChunksRef.current = [];

    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsListening(true);

      // 2. Audio level meter
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      } catch (e) {
        console.warn('AudioContext volume metering disabled', e);
      }

      // 3. Web Speech Recognition API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      let usedNative = false;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let currentText = '';
            let hasFinal = false;

            for (let i = event.resultIndex; i < event.results.length; i++) {
              currentText += event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                hasFinal = true;
              }
            }

            if (currentText.trim()) {
              setTranscript(currentText);

              // Clear previous silence timeout
              if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

              // If marked final or after 1.2s silence, auto submit!
              if (hasFinal) {
                triggerAutoSubmit(currentText);
              } else {
                silenceTimeoutRef.current = setTimeout(() => {
                  triggerAutoSubmit(latestTranscriptRef.current);
                }, 1400);
              }
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('SpeechRecognition error:', e.error);
            if (e.error === 'not-allowed') {
              setErrorMsg('Microphone access denied. Please allow microphone permissions in your browser.');
            }
          };

          recognition.onend = () => {
            setIsListening(false);
            if (latestTranscriptRef.current.trim() && !isFinished) {
              triggerAutoSubmit(latestTranscriptRef.current);
            }
          };

          recognition.start();
          usedNative = true;
        } catch (err) {
          console.warn('Native SpeechRecognition unavailable, falling back to MediaRecorder + Gemini');
        }
      }

      // 4. MediaRecorder fallback / backup
      try {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (audioChunksRef.current.length > 0 && (!usedNative || !latestTranscriptRef.current.trim())) {
            const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
            await sendAudioToBackend(audioBlob, mediaRecorder.mimeType);
          }
        };

        mediaRecorder.start(250);
      } catch (e) {
        console.warn('MediaRecorder init warning:', e);
      }
    } catch (err: any) {
      console.error('Microphone error:', err);
      setIsListening(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone permission denied. Please allow access in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No microphone found on your device.');
      } else {
        setErrorMsg('Microphone error: ' + (err.message || 'Check your audio settings'));
      }
    }
  };

  const sendAudioToBackend = async (audioBlob: Blob, mimeType: string) => {
    if (latestTranscriptRef.current.trim()) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        try {
          const res = await api.post('/ai/transcribe-audio', {
            audio: base64Audio,
            mimeType: mimeType || 'audio/webm',
          });
          if (res.data && res.data.transcript) {
            const trans = res.data.transcript;
            setTranscript(trans);
            triggerAutoSubmit(trans);
          }
        } catch (e) {
          console.error('Backend transcription failed:', e);
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (err) {
      setIsProcessing(false);
    }
  };

  const handleManualDone = () => {
    if (transcript.trim()) {
      triggerAutoSubmit(transcript.trim());
    } else {
      stopListening();
      onClose();
    }
  };

  const handleRetry = () => {
    stopListening();
    startListening();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#161B26] border border-white/15 rounded-3xl p-8 max-w-md w-full text-center relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={() => {
            clearAllTimeouts();
            stopListening();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          title="Close voice search"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Microphone Graphic */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Animated Ripples when listening */}
          {isListening && !isFinished && (
            <>
              <div
                className="absolute rounded-full bg-[#FF4D6D]/20 animate-ping"
                style={{
                  width: `${80 + Math.min(audioLevel, 60)}px`,
                  height: `${80 + Math.min(audioLevel, 60)}px`,
                }}
              />
              <div
                className="absolute rounded-full bg-[#FF4D6D]/10 transition-all duration-75"
                style={{
                  width: `${100 + audioLevel}px`,
                  height: `${100 + audioLevel}px`,
                }}
              />
            </>
          )}

          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center z-10 transition-all shadow-xl ${
              isFinished
                ? 'bg-emerald-500 text-white scale-110 shadow-emerald-500/30'
                : errorMsg
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : isListening
                ? 'bg-[#FF4D6D] text-white shadow-[#FF4D6D]/40 scale-105'
                : isProcessing
                ? 'bg-purple-600/30 text-purple-300 animate-pulse'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            {isFinished ? (
              <CheckCircle2 className="w-12 h-12 text-white animate-in zoom-in" />
            ) : isProcessing ? (
              <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
            ) : errorMsg ? (
              <MicOff className="w-10 h-10 text-red-400" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </div>
        </div>

        {/* Waveform Equalizer when active */}
        {isListening && !errorMsg && !isFinished && (
          <div className="flex items-center justify-center gap-1.5 h-8 my-3">
            {[40, 70, 100, 60, 90, 50, 80].map((baseHeight, idx) => {
              const h = Math.max(15, Math.min(100, (audioLevel / 100) * baseHeight + Math.random() * 20));
              return (
                <div
                  key={idx}
                  className="w-1.5 bg-[#FF4D6D] rounded-full transition-all duration-75"
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>
        )}

        {/* Status Heading */}
        <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          {isFinished ? (
            'Searching...'
          ) : errorMsg ? (
            'Microphone Error'
          ) : isListening ? (
            <>
              <span>Listening...</span>
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#FF4D6D] animate-ping" />
            </>
          ) : isProcessing ? (
            'AI Transcribing...'
          ) : (
            'Tap mic to speak'
          )}
        </h3>

        {/* Live Transcript Display */}
        {errorMsg ? (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl p-3 my-3">
            {errorMsg}
          </p>
        ) : (
          <div className="min-h-[60px] flex items-center justify-center my-3">
            {transcript ? (
              <p className="text-lg font-medium text-white bg-white/5 border border-white/10 rounded-xl p-3 w-full animate-in fade-in">
                "{transcript}"
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                {isListening
                  ? 'Speak into your microphone...'
                  : 'Try saying "AI Coding", "Gaming 4K", or "LoFi beats"'}
              </p>
            )}
          </div>
        )}

        {/* Buttons / Controls */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {errorMsg ? (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          ) : isListening ? (
            <button
              onClick={handleManualDone}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#FF4D6D] hover:bg-[#FF4D6D]/90 text-white rounded-full font-semibold transition-all shadow-lg shadow-[#FF4D6D]/30"
            >
              <Search className="w-4 h-4" />
              <span>{transcript.trim() ? 'Search Now' : 'Stop'}</span>
            </button>
          ) : (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-200 rounded-full text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Speak Again</span>
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Sparkles className="w-3.5 h-3.5 text-[#FF4D6D]" />
          <span>YouTube-style Voice Search connected directly to Search Bar</span>
        </div>
      </div>
    </div>
  );
};
