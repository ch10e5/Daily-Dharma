import React from 'react';

const LotusSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative w-16 h-16 animate-spin-slow">
        {/* Abstract Lotus Petals */}
        <svg viewBox="0 0 100 100" className="w-full h-full text-monk-orange opacity-80 fill-current">
          <path d="M50 0 C60 20 80 40 50 50 C20 40 40 20 50 0 Z" transform="rotate(0 50 50)" />
          <path d="M50 0 C60 20 80 40 50 50 C20 40 40 20 50 0 Z" transform="rotate(45 50 50)" />
          <path d="M50 0 C60 20 80 40 50 50 C20 40 40 20 50 0 Z" transform="rotate(90 50 50)" />
          <path d="M50 0 C60 20 80 40 50 50 C20 40 40 20 50 0 Z" transform="rotate(135 50 50)" />
          <path d="M50 0 C60 20 80 40 50 50 C20 40 40 20 50 0 Z" transform="rotate(180 50 50)" />
          <path d="M50 0 C60 20 80 40 50 50 C20 40 40 20 50 0 Z" transform="rotate(225 50 50)" />
          <path d="M50 0 C60 20 80 40 50 50 C20 40 40 20 50 0 Z" transform="rotate(270 50 50)" />
          <path d="M50 0 C60 20 80 40 50 50 C20 40 40 20 50 0 Z" transform="rotate(315 50 50)" />
        </svg>
      </div>
      <p className="text-stone-500 font-serif italic text-sm tracking-widest animate-pulse">Meditating...</p>
    </div>
  );
};

export default LotusSpinner;