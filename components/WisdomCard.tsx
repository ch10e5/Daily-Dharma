import React from 'react';
import { DharmaWisdom } from '../types';

interface WisdomCardProps {
  data: DharmaWisdom;
  audioSlot?: React.ReactNode;
}

const WisdomCard: React.FC<WisdomCardProps> = ({ data, audioSlot }) => {
  return (
    <div className="bg-paper-cream rounded-2xl shadow-2xl border border-stone-200 overflow-hidden max-w-2xl w-full mx-auto transform transition-all duration-1000 ease-out animate-fade-in-up">
      {/* Header Band */}
      <div className="h-1.5 bg-gradient-to-r from-temple-gold via-monk-orange to-sage-green w-full"></div>
      
      <div className="p-8 md:p-14 space-y-10 relative">
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

        {/* Affirmation */}
        <div className="text-center py-4 px-6 bg-sage-green/5 rounded-xl border border-sage-green/10">
           <p className="text-[10px] uppercase tracking-[0.2em] text-sage-green font-display mb-1">Affirmation</p>
           <p className="text-xl md:text-2xl font-serif text-stone-700 italic">
             {data.affirmation}
           </p>
        </div>

        {/* Content Section */}
        <div className="space-y-10">
          {/* Definition & Wisdom */}
          <div className="space-y-8">
            <div className="space-y-2">
               <h3 className="font-display text-[10px] text-stone-400 uppercase tracking-widest">The Essence</h3>
               <p className="font-sans text-deep-charcoal leading-relaxed text-lg italic">
                 {data.definition}
               </p>
               {/* Audio Button Slot */}
               {audioSlot && <div className="pt-2">{audioSlot}</div>}
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
        </div>
      </div>
    </div>
  );
};

export default WisdomCard;