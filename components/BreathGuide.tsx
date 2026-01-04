
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
            if (nextCycles >= 1) {
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

  // Determine transition duration based on phase
  const getTransitionDuration = () => {
    if (phase === 'Inhale') return '4000ms';
    if (phase === 'Hold') return '4000ms';
    if (phase === 'Exhale') return '6000ms';
    return '1000ms';
  };

  // Determine scale based on phase
  const getScale = () => {
    if (phase === 'Inhale' || phase === 'Hold') return 'scale-[2.5]';
    return 'scale-100';
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12 animate-fade-in">
      <div className="relative flex items-center justify-center">
        {/* Animated Breath Circle - Outer Aura */}
        <div 
          className={`absolute rounded-full border-2 border-temple-gold/30 transition-all ease-in-out ${getScale()}
            ${phase === 'Exhale' ? 'opacity-10' : 'opacity-20'}
          `}
          style={{ 
            width: '100px', 
            height: '100px',
            transitionDuration: getTransitionDuration()
          }}
        />
        
        {/* Animated Breath Circle - Inner Glow */}
        <div 
          className={`absolute rounded-full bg-temple-gold/10 transition-all ease-in-out ${getScale()}
            ${phase === 'Exhale' ? 'opacity-50' : 'opacity-100'}
          `}
          style={{ 
            width: '100px', 
            height: '100px',
            transitionDuration: getTransitionDuration()
          }}
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
        {phase === 'Inhale' && 'Breath in the light...'}
        {phase === 'Hold' && 'Settle in the stillness...'}
        {phase === 'Exhale' && 'Release all tension...'}
        {phase === 'Settle' && 'Ready to receive.'}
      </p>
    </div>
  );
};

export default BreathGuide;
