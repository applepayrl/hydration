import React from 'react';
import { CupId } from '../../types/hydration';
import { CUP_LIST } from '../../utils/storage';
import { GlassSelectorScene } from '../3d/GlassSelectorScene';
import { Plus } from 'lucide-react';

interface GlassPickerDockProps {
  onSelectCup: (cupId: CupId) => void;
  disabled?: boolean;
}

export const GlassPickerDock: React.FC<GlassPickerDockProps> = ({ onSelectCup, disabled = false }) => {
  return (
    <div className="safe-bottom w-full pt-2 z-20 select-none">
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Tap Glass to Drink
        </span>
        <span className="text-[10px] text-cyan-400 font-medium">3 Custom Glass Shapes</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {CUP_LIST.map((cup) => {
          return (
            <button
              key={cup.id}
              disabled={disabled}
              onClick={() => onSelectCup(cup.id)}
              className="group relative flex flex-col items-center rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-cyan-400/50 hover:from-white/[0.12] p-2 transition-all duration-200 active:scale-95 shadow-lg overflow-hidden text-left"
            >
              {/* Top Capacity Badge */}
              <div className="w-full flex items-center justify-between mb-1 z-10">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/25 text-sky-200 border border-sky-400/30">
                  {cup.capacityOz} oz
                </span>
                <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors">
                  <Plus className="w-3 h-3" />
                </div>
              </div>

              {/* 3D Glass Model Preview */}
              <div className="w-full h-24 relative flex items-center justify-center my-0.5 pointer-events-none">
                <GlassSelectorScene cupId={cup.id} fillRatio={0.8} autoRotate={true} />
              </div>

              {/* Title & Subtitle */}
              <div className="w-full mt-1 text-center z-10">
                <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                  {cup.shortName}
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight line-clamp-2">
                  {cup.subtitle}
                </p>
              </div>

              {/* Subtle hover glow */}
              <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-colors pointer-events-none" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
