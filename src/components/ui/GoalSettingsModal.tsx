import React, { useState } from 'react';
import { X, Target, Volume2, VolumeX, Smartphone, RotateCcw } from 'lucide-react';

interface GoalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetOz: number;
  onSaveTarget: (oz: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  hapticsEnabled: boolean;
  onToggleHaptics: () => void;
  onResetToday: () => void;
}

const PRESET_GOALS = [32, 48, 64, 72, 80, 100];

export const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({
  isOpen,
  onClose,
  targetOz,
  onSaveTarget,
  soundEnabled,
  onToggleSound,
  hapticsEnabled,
  onToggleHaptics,
  onResetToday,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<number>(targetOz);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveTarget(selectedTarget);
    onClose();
  };

  return (
    <div className="safe-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-slate-900/95 border border-white/15 rounded-3xl p-5 shadow-2xl overflow-hidden flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/20">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Daily Target</h3>
              <p className="text-xs text-slate-400">Set your daily hydration goal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Goal Preset Grid including 32oz, up to 100oz */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-2">Target Volume (oz)</label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_GOALS.map((oz) => {
              const isSelected = selectedTarget === oz;
              return (
                <button
                  key={oz}
                  onClick={() => setSelectedTarget(oz)}
                  className={`py-2.5 px-3 rounded-xl font-bold text-sm transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 shadow-lg shadow-sky-500/25 scale-[1.02]'
                      : 'bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.09]'
                  }`}
                >
                  {oz} oz
                  <span className="block text-[9px] opacity-75 font-normal">
                    {Math.round(oz * 29.57)} ml
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio & Haptic Toggles */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-2 text-xs text-white">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>Water Pour & Clink Sound FX</span>
            </div>
            <button
              onClick={onToggleSound}
              className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-2 text-xs text-white">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Haptic Feedback</span>
            </div>
            <button
              onClick={onToggleHaptics}
              className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                hapticsEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Reset day action */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Reset today’s water intake?')) {
                onResetToday();
                onClose();
              }
            }}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Today</span>
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
          >
            Save Target
          </button>
        </div>
      </div>
    </div>
  );
};
