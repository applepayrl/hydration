import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, X } from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface CelebrationOverlayProps {
  isOpen: boolean;
  totalOz: number;
  targetOz: number;
  onClose: () => void;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  isOpen,
  totalOz,
  targetOz,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Play celebration audio chord
    soundEngine.playCelebrationSound();
    soundEngine.triggerHaptic('success');

    // Confetti burst
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#38bdf8', '#60a5fa', '#34d399', '#fcd34d', '#ffffff'];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="safe-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-400/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(56,189,248,0.25)] text-center flex flex-col items-center">
        {/* Glow */}
        <div className="absolute -top-12 inset-x-0 h-24 bg-cyan-400/20 blur-2xl pointer-events-none rounded-full" />

        {/* Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 shadow-xl mb-4 animate-bounce">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hydration Goal Unlocked!</span>
        </div>

        <h3 className="text-2xl font-extrabold text-white tracking-tight">
          {totalOz} oz Drunk Today!
        </h3>

        <p className="text-xs text-slate-300 mt-2 max-w-[240px] leading-relaxed">
          You've completed 100% of your daily {targetOz} oz hydration target. Your body thanks you!
        </p>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-400/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Keep Hydrating
        </button>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
