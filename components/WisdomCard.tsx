import React from 'react';
import { DharmaWisdom } from '../types';

interface WisdomCardProps {
  data: DharmaWisdom;
}

const WisdomCard: React.FC<WisdomCardProps> = ({ data }) => {
  return (
    <div className="bg-paper-cream rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-w-2xl w-full mx-auto transform transition-all duration-1000 ease-out animate-fade-in-up">
      {/* Header Band */}
      <div className="h-1.5 bg-gradient-to-r from-temple-gold via-monk-orange to-sage-green w-full"></div>
      
      <div className="p-8 md:p-14 space-y-10 relative">
        {/* Background Watermark */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
             <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,19c-3.87,0-7-3.13-7-7s3.13-7,7-7 s7,3.13,7,7S15.87,19,12,19z M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5S14.76,7,12,7z"/>
             </svg>
        </div>

        {/* Title Section */}
        <div className="text-center space-y-4">
          <p className="text-temple-gold font-display uppercase tracking-[0.3em] text-[10px] md:text-xs">Higher Consciousness</p>
          <h1 className="text-5xl md:text-7xl font-serif text-deep-charcoal text-balance leading-tight">
            {data.term}
          </h1>
          <div className="flex items-center justify-center gap-3">
             <div className="h-px bg-stone-300 w-8"></div>
             <p className="text-stone-500 font-sans text-sm md:text-base italic tracking-wide">
                {data.originalTerm} • {data.language}
             </p>
             <div className="h-px bg-stone-300 w-8"></div>
          </div>
          <div className="inline-block mt-4 px-6 py-2 bg-stone-50/50 rounded-full border border-stone-200/50">
            <span className="text-xl md:text-2xl font-serif text-monk-orange italic">
              "{data.translation}"
            </span>
          </div>
        </div>

        {/* Affirmation (New) */}
        <div className="text-center py-4 px-6 bg-sage-green/5 rounded-xl border border-sage-green/10">
           <p className="text-[10px] uppercase tracking-[0.2em] text-sage-green font-display mb-1">Affirmation</p>
           <p className="text-xl md:text-2xl font-serif text-stone-700 italic">
             {data.affirmation}
           </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-10 mt-10">
          
          {/* Definition & Wisdom */}
          <div className="space-y-6">
            <div className="space-y-2">
               <h3 className="font-display text-[10px] text-stone-400 uppercase tracking-widest">The Essence</h3>
               <p className="font-sans text-deep-charcoal leading-relaxed text-lg italic">
                 {data.definition}
               </p>
            </div>
            
            <div className="space-y-4">
               <h3 className="font-display text-[10px] text-temple-gold uppercase tracking-widest flex items-center gap-2">
                 Ancient Insight
               </h3>
               <p className="font-serif text-stone-800 leading-9 text-xl md:text-2xl">
                 {data.wisdom}
               </p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent w-full"></div>

          {/* Application */}
          <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl border border-stone-200/50 space-y-3 shadow-inner">
             <h3 className="font-display text-[10px] text-sage-green uppercase tracking-widest font-bold">In Your World</h3>
             <p className="font-sans text-stone-700 leading-relaxed text-lg">
               {data.application}
             </p>
          </div>

          {/* Reflection Prompt */}
          <div className="text-center pt-2">
             <h3 className="font-display text-[10px] text-stone-400 uppercase tracking-widest mb-4">A Question to Ponder</h3>
             <p className="font-serif text-2xl md:text-3xl text-deep-charcoal italic leading-relaxed px-4">
               “{data.reflectionPrompt}”
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WisdomCard;