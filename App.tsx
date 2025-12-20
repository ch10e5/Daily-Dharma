import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DharmaWisdom, CachedWisdom, LoadingState, SessionState } from './types';
import { fetchDailyWisdom, generateWisdomAudio, generateReflectiveEcho } from './services/geminiService';
import WisdomCard from './components/WisdomCard';
import LotusSpinner from './components/LotusSpinner';
import BreathGuide from './components/BreathGuide';

const STORAGE_KEY = 'dharma_daily_wisdom_v2';

// Helper to decode base64 string
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to decode raw PCM data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function App() {
  const [wisdom, setWisdom] = useState<DharmaWisdom | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.WELCOME);
  
  // Reflection states
  const [userReflection, setUserReflection] = useState('');
  const [dharmaEcho, setDharmaEcho] = useState('');
  const [isEchoing, setIsEchoing] = useState(false);

  // Audio state
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const playSingingBowl = async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(432, ctx.currentTime); // 432Hz "Healing" frequency
    osc.frequency.exponentialRampToValueAtTime(108, ctx.currentTime + 3);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 4.1);
  };

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {}
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handleListen = async () => {
    if (!wisdom) return;
    if (isPlaying) {
      stopAudio();
      return;
    }

    setIsAudioLoading(true);
    try {
      const script = `The concept is ${wisdom.term}. ${wisdom.translation}. ${wisdom.definition}. Wisdom says: ${wisdom.wisdom}. Practice this today: ${wisdom.application}. Your affirmation: ${wisdom.affirmation}.`;
      const base64Audio = await generateWisdomAudio(script);
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();

      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsPlaying(false);
        audioSourceRef.current = null;
      };
      audioSourceRef.current = source;
      source.start(0);
      setIsPlaying(true);
    } catch (error) {
      console.error(error);
      alert("Silence is golden, but audio failed to load.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const loadWisdom = useCallback(async (forceNew: boolean = false) => {
    setLoadingState(LoadingState.LOADING);
    const today = new Date().toDateString();
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored && !forceNew) {
      const cached: CachedWisdom = JSON.parse(stored);
      if (cached.date === today) {
        setWisdom(cached.data);
        setLoadingState(LoadingState.SUCCESS);
        return;
      }
    }

    try {
      const newWisdom = await fetchDailyWisdom([]);
      setWisdom(newWisdom);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, data: newWisdom }));
      setLoadingState(LoadingState.SUCCESS);
    } catch (error) {
      setLoadingState(LoadingState.ERROR);
    }
  }, []);

  const handleReflect = async () => {
    if (!userReflection.trim() || !wisdom) return;
    setIsEchoing(true);
    const echo = await generateReflectiveEcho(wisdom.term, userReflection);
    setDharmaEcho(echo);
    setIsEchoing(false);
  };

  useEffect(() => {
    loadWisdom();
    return () => {
      stopAudio();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [loadWisdom, stopAudio]);

  const startRitual = () => {
    playSingingBowl();
    setSessionState(SessionState.BREATHING);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-monk-orange/30 overflow-x-hidden relative">
      {/* Energy Aura Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-temple-gold/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sage-green/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 w-full p-6 flex justify-between items-center backdrop-blur-md bg-white/30 border-b border-stone-200/50 sticky top-0">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setSessionState(SessionState.WELCOME)}>
            <span className="text-2xl text-monk-orange group-hover:rotate-180 transition-transform duration-1000">☸</span>
            <span className="font-display font-semibold text-lg tracking-widest text-deep-charcoal">DHARMA DAILY</span>
        </div>
        <div className="text-[10px] md:text-xs font-serif text-stone-400 uppercase tracking-widest">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </nav>

      {/* Main Container */}
      <main className="relative z-10 flex-grow container mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center">
        
        {loadingState === LoadingState.LOADING && <LotusSpinner />}

        {loadingState === LoadingState.ERROR && (
          <div className="text-center space-y-6 animate-fade-in">
            <p className="text-red-800 font-serif text-lg">The cloud is passing. Please try again.</p>
            <button onClick={() => loadWisdom(true)} className="px-10 py-3 bg-stone-800 text-stone-100 rounded-full font-display text-xs tracking-widest uppercase hover:bg-black transition-all">Try Again</button>
          </div>
        )}

        {loadingState === LoadingState.SUCCESS && wisdom && (
          <div className="w-full flex flex-col items-center">
            
            {sessionState === SessionState.WELCOME && (
              <div className="text-center space-y-12 animate-fade-in max-w-lg">
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-serif text-deep-charcoal italic leading-tight">Welcome home, seeker.</h2>
                  <p className="text-stone-500 font-sans leading-relaxed text-lg">Before we unveil today's wisdom, let us take a moment to settle the mind and open the heart.</p>
                </div>
                <button 
                  onClick={startRitual}
                  className="group relative px-12 py-5 bg-deep-charcoal text-stone-100 rounded-full font-display text-sm tracking-[0.3em] uppercase overflow-hidden transition-all hover:scale-105 active:scale-95"
                >
                  <span className="relative z-10">Ring the Bell</span>
                  <div className="absolute inset-0 bg-temple-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 opacity-20" />
                </button>
              </div>
            )}

            {sessionState === SessionState.BREATHING && (
              <BreathGuide onComplete={() => setSessionState(SessionState.WISDOM)} />
            )}

            {sessionState === SessionState.WISDOM && (
              <div className="w-full flex flex-col items-center space-y-12 animate-fade-in">
                <WisdomCard data={wisdom} />
                
                {/* Interaction Section */}
                <div className="w-full max-w-2xl space-y-12 pb-20">
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-center gap-6">
                    <button 
                      onClick={handleListen}
                      disabled={isAudioLoading}
                      className={`group flex items-center gap-3 px-8 py-4 rounded-full border transition-all duration-500 font-display text-[10px] tracking-widest uppercase
                        ${isPlaying 
                          ? 'border-monk-orange bg-monk-orange text-white' 
                          : 'border-stone-300 text-stone-600 hover:border-monk-orange hover:text-monk-orange'
                        }
                      `}
                    >
                      {isAudioLoading ? <span className="animate-pulse">Preparing Voice...</span> : (
                        <>
                          <svg className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                          {isPlaying ? 'Rest in Silence' : 'Listen to Teacher'}
                        </>
                      )}
                    </button>

                    <button 
                      onClick={() => {
                        const text = `Dharma Daily: ${wisdom.term}\n"${wisdom.wisdom}"\nAffirmation: ${wisdom.affirmation}`;
                        if (navigator.share) navigator.share({ title: 'Dharma Daily', text, url: window.location.href });
                        else alert("Copied to heart.");
                      }}
                      className="flex items-center gap-3 px-8 py-4 rounded-full border border-stone-300 text-stone-600 hover:border-temple-gold hover:text-temple-gold transition-all duration-500 font-display text-[10px] tracking-widest uppercase"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                      Share Light
                    </button>
                  </div>

                  {/* Reflection Journal */}
                  <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-100 space-y-8">
                    <div className="text-center space-y-2">
                       <h3 className="font-display text-[10px] text-stone-400 uppercase tracking-widest">Contemplative Space</h3>
                       <p className="font-serif text-xl italic text-deep-charcoal">How does {wisdom.term} resonate with you today?</p>
                    </div>
                    
                    <textarea 
                      value={userReflection}
                      onChange={(e) => setUserReflection(e.target.value)}
                      placeholder="Write your heart's reflection here..."
                      className="w-full min-h-[150px] p-6 rounded-2xl bg-stone-50 border border-stone-100 focus:outline-none focus:ring-2 focus:ring-monk-orange/20 focus:bg-white transition-all font-sans text-stone-700 leading-relaxed resize-none"
                    />

                    <div className="flex flex-col items-center gap-6">
                      <button 
                        onClick={handleReflect}
                        disabled={isEchoing || !userReflection.trim()}
                        className="px-10 py-4 bg-deep-charcoal text-white rounded-full font-display text-[10px] tracking-[0.2em] uppercase hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        {isEchoing ? 'Gleaning Insight...' : 'Offer Reflection'}
                      </button>

                      {dharmaEcho && (
                        <div className="p-8 bg-sage-green/5 rounded-2xl border border-sage-green/20 animate-fade-in-up w-full text-center">
                          <p className="text-[10px] uppercase tracking-widest text-sage-green font-display mb-3">Dharma Echo</p>
                          <p className="font-serif text-xl md:text-2xl text-stone-800 leading-relaxed italic">
                            “{dharmaEcho}”
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* New Word Trigger */}
                  <div className="text-center pt-8">
                    <button 
                      onClick={() => {
                        stopAudio();
                        setDharmaEcho('');
                        setUserReflection('');
                        setSessionState(SessionState.WELCOME);
                        loadWisdom(true);
                      }}
                      className="text-stone-400 hover:text-monk-orange transition-colors font-sans text-sm underline underline-offset-8 decoration-stone-200"
                    >
                      Seek another path of wisdom
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 py-10 text-center text-stone-400 text-[10px] font-sans tracking-widest uppercase">
        <div className="flex justify-center gap-6 mb-4">
          <span>Peace</span>
          <span className="text-stone-300">•</span>
          <span>Clarity</span>
          <span className="text-stone-300">•</span>
          <span>Metta</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Dharma Daily. May all beings be free.</p>
      </footer>
    </div>
  );
}

export default App;