import React from 'react';
import { Flame, Settings2, History as HistoryIcon, Volume2, VolumeX } from 'lucide-react';

interface IntakeHeaderProps {
  totalOz: number;
  targetOz: number;
  totalMl: number;
  streakDays: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

export const IntakeHeader: React.FC<IntakeHeaderProps> = ({
  totalOz,
  targetOz,
  totalMl,
  streakDays,
  soundEnabled,
  onToggleSound,
  onOpenHistory,
  onOpenSettings,
}) => {
  const percent = Math.min(100, Math.round((totalOz / targetOz) * 100));
  const remainingOz = Math.max(0, targetOz - totalOz);
  const isGoalMet = totalOz >= targetOz;

  // SVG Circular progress radius
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="w-full flex flex-col gap-3 px-5 pt-3 pb-2 z-20 select-none">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Daily Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold backdrop-blur-md">
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{streakDays} Day Streak</span>
          </div>
        </div>

        {/* Quick controls right */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            className="p-2 rounded-full bg-slate-800/60 border border-white/10 hover:bg-slate-700/60 text-slate-300 hover:text-white backdrop-blur-md transition-all active:scale-95"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            onClick={onOpenHistory}
            title="Drink History"
            className="p-2 rounded-full bg-slate-800/60 border border-white/10 hover:bg-slate-700/60 text-slate-300 hover:text-white backdrop-blur-md transition-all active:scale-95"
          >
            <HistoryIcon className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenSettings}
            title="Daily Target Settings"
            className="p-2 rounded-full bg-slate-800/60 border border-white/10 hover:bg-slate-700/60 text-slate-300 hover:text-white backdrop-blur-md transition-all active:scale-95"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Prominent Intake Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white/[0.09] to-white/[0.03] border border-white/15 p-4 backdrop-blur-xl shadow-xl">
        {/* Ambient glow in background */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between">
          {/* Main Numbers */}
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-cyan-300/90 block mb-0.5">
              Today's Hydration
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold tracking-tight text-white font-outfit">
                {totalOz}
              </span>
              <span className="text-lg font-semibold text-slate-300">oz</span>
              <span className="text-xs text-slate-400 ml-1">({totalMl} ml)</span>
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-xs font-medium">
              {isGoalMet ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  ✨ Daily Goal Achieved!
                </span>
              ) : (
                <span className="text-slate-300">
                  <strong className="text-sky-300">{remainingOz} oz</strong> remaining of {targetOz} oz
                </span>
              )}
            </div>
          </div>

          {/* Circular Progress Ring */}
          <div className="relative flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-slate-800/80"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="transition-all duration-700 ease-out"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="60%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>

            {/* Percentage center */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-white leading-none font-outfit">
                {percent}%
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">goal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
