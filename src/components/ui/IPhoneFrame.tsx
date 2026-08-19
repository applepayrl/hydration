import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Sparkles, Smartphone, Monitor } from 'lucide-react';

interface IPhoneFrameProps {
  children: React.ReactNode;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({
  children,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [timeString, setTimeString] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeString(
        d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isFullscreen) {
    return (
      <div className="relative w-screen h-screen bg-slate-950 text-white overflow-hidden flex flex-col">
        {/* Floating exit fullscreen button */}
        <button
          onClick={onToggleFullscreen}
          title="Switch to iPhone 17 Pro Frame"
          className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/15 backdrop-blur-md text-xs font-semibold text-cyan-300 hover:bg-slate-800 shadow-xl transition-all active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>iPhone Frame</span>
        </button>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-[#070b14] to-slate-900 text-white flex flex-col items-center justify-center p-3 sm:p-6 select-none">
      {/* Top Desktop Controls */}
      <header className="mb-4 flex items-center justify-between w-full max-w-[420px] px-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">AquaFlow 3D</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-400/20">
            iPhone 17 Pro
          </span>
        </div>

        <button
          onClick={onToggleFullscreen}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-[11px]"
        >
          <Monitor className="w-3 h-3 text-cyan-400" />
          <span>Fullscreen</span>
        </button>
      </header>

      {/* iPhone 17 Pro Outer Titanium Chassis */}
      <div className="relative w-[393px] h-[852px] max-h-[95vh] rounded-[54px] p-[11px] bg-gradient-to-b from-[#2a303c] via-[#1a202c] to-[#12161f] shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden border border-white/10">
        {/* Inner Black Bezel */}
        <div className="relative w-full h-full rounded-[45px] bg-[#090d16] overflow-hidden flex flex-col border border-black/40">
          {/* iOS Status Bar */}
          <div className="relative h-11 w-full px-7 flex items-center justify-between text-xs font-semibold text-white z-40 shrink-0 pointer-events-none select-none">
            {/* Clock */}
            <span className="font-outfit text-xs font-bold tracking-tight">{timeString}</span>

            {/* Dynamic Island */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 h-[30px] w-[116px] bg-black rounded-full flex items-center justify-between px-3 shadow-md border border-white/5 pointer-events-auto">
              <div className="w-2.5 h-2.5 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-blue-900/60" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px]">💧</span>
                <span className="text-[9px] font-bold text-cyan-400 tracking-tight">AquaFlow</span>
              </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-[10px] font-bold tracking-tighter">5G</span>
              <Wifi className="w-3.5 h-3.5" />
              <BatteryMedium className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* App Screen Content */}
          <div className="flex-1 w-full relative flex flex-col overflow-hidden">
            {children}
          </div>

          {/* iOS Home Bar Indicator */}
          <div className="h-5 w-full flex items-center justify-center shrink-0 z-40 pointer-events-none">
            <div className="w-32 h-1 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>

      <footer className="mt-3 text-center text-[11px] text-slate-500 max-w-sm">
        Custom-built 3D water intake tracker matching the 3 physical reference glasses (10oz, 10oz, 8oz).
      </footer>
    </div>
  );
};
