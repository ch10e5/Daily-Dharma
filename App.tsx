import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DharmaWisdom, CachedWisdom, LoadingState, SessionState } from './types';
import { fetchDailyWisdom, generateWisdomAudio, generateReflectiveEcho } from './services/geminiService';
import WisdomCard from './components/WisdomCard';
import LotusSpinner from './components/LotusSpinner';
import BreathGuide from './components/BreathGuide';

const STORAGE_KEY = 'dharma_daily_wisdom_v2';

// Helper to decode base64 string safely
function decode(base64: string) {
  // Remove any whitespace or potential data URI prefix if present
  const cleanBase64 = base64.replace(/^data:audio\/\w+;base64,/, '').replace(/\s/g, '');
  const binaryString = atob(cleanBase64);
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
  // Gemini TTS returns 16-bit PCM. Each sample is 2 bytes.
  // Ensure we handle potential offset and length correctly.
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
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
  const [isSharing, setIsSharing] = useState(false);

  // Audio state
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferPromiseRef = useRef<Promise<AudioBuffer> | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  }, []);

  const playSingingBowl = async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.6, now + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 6);

    const harmonics = [
      { f: 172.0, g: 0.5, type: 'sine' as const },
      { f: 474.7, g: 0.2, type: 'sine' as const },
      { f: 928.8, g: 0.1, type: 'sine' as const },
      { f: 1530.8, g: 0.05, type: 'sine' as const }
    ];

    harmonics.forEach(({ f, g, type }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f + (Math.random() * 0.5), now + 6);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(g, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);
      
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 6);
    });

    const strike = ctx.createOscillator();
    const strikeGain = ctx.createGain();
    strike.type = 'triangle';
    strike.frequency.setValueAtTime(800, now);
    strike.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    strikeGain.gain.setValueAtTime(0.3, now);
    strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    strike.connect(strikeGain);
    strikeGain.connect(masterGain);
    strike.start(now);
    strike.stop(now + 0.2);
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

  const preFetchAudio = useCallback((wisdomData: DharmaWisdom) => {
    if (audioBufferPromiseRef.current) return;
    
    // We start the full pipeline: Fetch -> Decode Base64 -> Decode PCM
    const fetchAndPrepare = async (): Promise<AudioBuffer> => {
      const script = `The concept is ${wisdomData.term}. ${wisdomData.translation}. ${wisdomData.definition}. Wisdom says: ${wisdomData.wisdom}. Practice this today: ${wisdomData.application}. Your affirmation: ${wisdomData.affirmation}.`;
      const base64Audio = await generateWisdomAudio(script);
      const ctx = getAudioContext();
      const audioBytes = decode(base64Audio);
      return await decodeAudioData(audioBytes, ctx, 24000, 1);
    };

    audioBufferPromiseRef.current = fetchAndPrepare();
  }, [getAudioContext]);

  const handleListen = async () => {
    if (!wisdom) return;
    if (isPlaying) {
      stopAudio();
      return;
    }

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    // If pre-fetch hasn't finished, show loading. Otherwise, it will be instant.
    setIsAudioLoading(true);
    try {
      if (!audioBufferPromiseRef.current) {
        preFetchAudio(wisdom);
      }
      
      // Await the fully decoded buffer
      const audioBuffer = await audioBufferPromiseRef.current!;

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
      audioBufferPromiseRef.current = null;
    } finally {
      setIsAudioLoading(false);
    }
  };

  const loadWisdom = useCallback(async (forceNew: boolean = false) => {
    setLoadingState(LoadingState.LOADING);
    audioBufferPromiseRef.current = null;
    const today = new Date().toDateString();
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored && !forceNew) {
      const cached: CachedWisdom = JSON.parse(stored);
      if (cached.date === today) {
        setWisdom(cached.data);
        setLoadingState(LoadingState.SUCCESS);
        preFetchAudio(cached.data);
        return;
      }
    }

    try {
      const newWisdom = await fetchDailyWisdom([]);
      setWisdom(newWisdom);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, data: newWisdom }));
      setLoadingState(LoadingState.SUCCESS);
      preFetchAudio(newWisdom);
    } catch (error) {
      setLoadingState(LoadingState.ERROR);
    }
  }, [preFetchAudio]);

  const handleReflect = async () => {
    if (!userReflection.trim() || !wisdom) return;
    setIsEchoing(true);
    const echo = await generateReflectiveEcho(wisdom.term, userReflection);
    setDharmaEcho(echo);
    setIsEchoing(false);
  };

  const generateWisdomImage = async (): Promise<Blob | null> => {
    if (!wisdom) return null;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = 1080;
    canvas.height = 1350;

    ctx.fillStyle = '#FDFBF7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#C8A357');
    gradient.addColorStop(0.5, '#D48C45');
    gradient.addColorStop(1, '#8FA89B');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, 25);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#C8A357';
    ctx.font = '300 30px "Cinzel"';
    ctx.fillText('HIGHER CONSCIOUSNESS', canvas.width / 2, 120);

    ctx.fillStyle = '#2C2C2C';
    ctx.font = 'bold 120px "Playfair Display"';
    ctx.fillText(wisdom.term, canvas.width / 2, 280);

    ctx.fillStyle = '#787878';
    ctx.font = 'italic 35px "Lato"';
    ctx.fillText(`${wisdom.originalTerm} • ${wisdom.language}`, canvas.width / 2, 360);

    const transText = `"${wisdom.translation}"`;
    ctx.font = 'italic 50px "Playfair Display"';
    const metrics = ctx.measureText(transText);
    const padding = 40;
    ctx.fillStyle = 'rgba(212, 140, 69, 0.05)';
    ctx.roundRect(canvas.width / 2 - metrics.width / 2 - padding, 400, metrics.width + padding * 2, 80, 40);
    ctx.fill();
    ctx.fillStyle = '#D48C45';
    ctx.fillText(transText, canvas.width / 2, 460);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#787878';
    ctx.font = 'bold 24px "Cinzel"';
    ctx.fillText('THE ESSENCE', 100, 580);
    
    ctx.fillStyle = '#2C2C2C';
    ctx.font = 'italic 36px "Lato"';
    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ');
      let line = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, y);
      return y + lineHeight;
    };

    let currentY = wrapText(wisdom.definition, 100, 640, 880, 50);

    currentY += 40;
    ctx.fillStyle = '#C8A357';
    ctx.font = 'bold 24px "Cinzel"';
    ctx.fillText('ANCIENT INSIGHT', 100, currentY);
    currentY += 60;
    ctx.fillStyle = '#2C2C2C';
    ctx.font = '48px "Playfair Display"';
    currentY = wrapText(wisdom.wisdom, 100, currentY, 880, 65);

    currentY += 60;
    ctx.fillStyle = 'rgba(143, 168, 155, 0.1)';
    ctx.roundRect(80, currentY, 920, 160, 24);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8FA89B';
    ctx.font = 'bold 20px "Cinzel"';
    ctx.fillText('AFFIRMATION', canvas.width / 2, currentY + 50);
    ctx.fillStyle = '#2C2C2C';
    ctx.font = 'italic 42px "Playfair Display"';
    ctx.fillText(wisdom.affirmation, canvas.width / 2, currentY + 110);

    ctx.fillStyle = '#D48C45';
    ctx.font = 'bold 30px "Cinzel"';
    ctx.fillText('DHARMA DAILY', canvas.width / 2, 1280);

    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
  };

  const handleShare = async () => {
    if (!wisdom) return;
    setIsSharing(true);

    try {
      const blob = await generateWisdomImage();
      if (!blob) throw new Error("Could not generate image");

      const file = new File([blob], `dharma-daily-${wisdom.term.toLowerCase()}.jpg`, { type: 'image/jpeg' });
      const shareData = {
        title: `Dharma Daily: ${wisdom.term}`,
        text: `Behold today's wisdom: ${wisdom.term}. ${wisdom.translation}.`,
        files: [file],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dharma-daily-${wisdom.term.toLowerCase()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert("The image of light has been saved to your device. Go forth and share.");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("Share failed", error);
      alert("The path to sharing was blocked, but the wisdom remains in your heart.");
    } finally {
      setIsSharing(false);
    }
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

  const ListenButton = (
    <button 
      onClick={handleListen}
      disabled={isAudioLoading && !isPlaying}
      className={`group flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 font-display text-[9px] tracking-widest uppercase
        ${isPlaying 
          ? 'border-monk-orange bg-monk-orange text-white shadow-md' 
          : 'border-stone-400 text-stone-600 hover:border-monk-orange hover:text-monk-orange bg-white shadow-sm'
        }
      `}
    >
      {isAudioLoading && !isPlaying ? <span className="animate-pulse">Preparing Voice...</span> : (
        <>
          <svg className={`w-3 h-3 ${isPlaying ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
          {isPlaying ? 'Pause' : 'Listen to Teacher'}
        </>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-paper-cream flex flex-col font-sans selection:bg-monk-orange/30 overflow-x-hidden relative transition-colors duration-[3000ms]">
      {/* Energy Aura Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-temple-gold/5 blur-[150px] rounded-full animate-aura-shift" style={{ animationDuration: '40s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-sage-green/5 blur-[150px] rounded-full animate-aura-shift" style={{ animationDuration: '35s', animationDelay: '-5s' }} />
        <div className="absolute top-[20%] right-[10%] w-[50%] h-[50%] bg-paper-cream/20 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '20s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 w-full p-6 flex justify-between items-center backdrop-blur-xl bg-white/10 border-b border-stone-200/30 sticky top-0">
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
                <WisdomCard data={wisdom} audioSlot={ListenButton} />
                
                <div className="w-full max-w-2xl pb-20">
                  {/* Contemplative Space Card */}
                  <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-stone-100 space-y-10">
                    <div className="text-center space-y-4">
                       <h3 className="font-display text-[11px] text-monk-orange font-bold uppercase tracking-[0.25em]">Contemplative Space</h3>
                       <div className="h-px w-12 bg-stone-200 mx-auto"></div>
                    </div>

                    {/* In Your World Section */}
                    <div className="space-y-4">
                       <h4 className="font-display text-[10px] text-sage-green uppercase tracking-widest font-bold">In Your World</h4>
                       <p className="font-sans text-stone-700 leading-relaxed text-lg">
                         {wisdom.application}
                       </p>
                    </div>

                    <div className="h-px bg-stone-100 w-full"></div>

                    {/* Reflection Prompt Section */}
                    <div className="space-y-6">
                       <div className="text-center">
                          <h4 className="font-display text-[10px] text-stone-400 uppercase tracking-widest mb-4">A Question to Ponder</h4>
                          <p className="font-serif text-2xl md:text-3xl text-deep-charcoal italic leading-relaxed">
                            “{wisdom.reflectionPrompt}”
                          </p>
                       </div>

                       <textarea 
                        value={userReflection}
                        onChange={(e) => setUserReflection(e.target.value)}
                        placeholder="Offer your heart's reflection to the silence..."
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

                    {/* Share Light Section */}
                    <div className="flex flex-col items-center pt-8 border-t border-stone-50">
                       <button 
                        onClick={handleShare}
                        disabled={isSharing}
                        className={`inline-flex items-center gap-3 px-10 py-5 rounded-full border-2 transition-all duration-700 font-display text-[10px] tracking-[0.3em] uppercase group
                          ${isSharing 
                            ? 'border-stone-100 text-stone-300' 
                            : 'border-monk-orange/20 text-monk-orange hover:bg-monk-orange hover:text-white hover:border-monk-orange shadow-lg hover:shadow-monk-orange/20'
                          }
                        `}
                      >
                        {isSharing ? (
                          <>
                            <div className="w-3 h-3 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                            <span>Crafting Vision...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 transition-transform group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                            </svg>
                            <span>Share Light</span>
                          </>
                        )}
                      </button>
                      <p className="mt-4 text-[10px] text-stone-400 font-sans tracking-widest uppercase">Spread the path to others</p>
                    </div>
                  </div>

                  <div className="text-center pt-12">
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