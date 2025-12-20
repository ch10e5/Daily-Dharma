import React, { useState, useEffect } from 'react';

interface BreathGuideProps {
  onComplete: () => void;
}

const BreathGuide: React.FC<BreathGuideProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Settle'>('Inhale');
  const [seconds, setSeconds] = useState(4);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          if (phase === 'Inhale') {
            setPhase('Hold');
            return 4;
          } else if (phase === 'Hold') {
            setPhase('Exhale');
            return 6;
          } else if (phase === 'Exhale') {
            const nextCycles = cycles + 1;
            if (nextCycles >= 2) {
              setPhase('Settle');
              setTimeout(onComplete, 2000);
              return 0;
            }
            setCycles(nextCycles);
            setPhase('Inhale');
            return 4;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, cycles, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center space-y-12 animate-fade-in">
      <div className="relative flex items-center justify-center">
        {/* Animated Breath Circle */}
        <div 
          className={`absolute rounded-full border-2 border-temple-gold/30 transition-all duration-[4000ms] ease-in-out
            ${phase === 'Inhale' ? 'scale-[2.5] opacity-20' : phase === 'Exhale' ? 'scale-100 opacity-10' : 'scale-[2.5] opacity-20'}
          `}
          style={{ width: '100px', height: '100px' }}
        />
        <div 
          className={`absolute rounded-full bg-temple-gold/10 transition-all duration-[4000ms] ease-in-out
            ${phase === 'Inhale' ? 'scale-[2.5] opacity-100' : phase === 'Exhale' ? 'scale-100 opacity-50' : 'scale-[2.5] opacity-100'}
          `}
          style={{ width: '100px', height: '100px' }}
        />
        
        {/* Center Label */}
        <div className="z-10 text-center">
          <p className="text-2xl font-serif text-deep-charcoal tracking-widest uppercase transition-opacity duration-500">
            {phase === 'Settle' ? 'At Peace' : phase}
          </p>
          {phase !== 'Settle' && (
            <p className="text-stone-400 font-sans text-lg">{seconds}</p>
          )}
        </div>
      </div>
      
      <p className="text-stone-500 font-sans italic text-center max-w-xs animate-pulse">
        Let the breath anchor you to the present moment...
      </p>
    </div>
  );
};

export default BreathGuide;