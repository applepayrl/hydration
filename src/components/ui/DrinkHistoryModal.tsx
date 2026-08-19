import React from 'react';
import { X, Trash2, Clock, PlusCircle } from 'lucide-react';
import { DrinkLogEntry } from '../../types/hydration';
import { CUPS } from '../../utils/storage';
import { GlassFallback2D } from '../3d/GlassFallback2D';

interface DrinkHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: DrinkLogEntry[];
  onRemoveLog: (id: string) => void;
  onLoadSamples: () => void;
  onClearAll: () => void;
}

export const DrinkHistoryModal: React.FC<DrinkHistoryModalProps> = ({
  isOpen,
  onClose,
  logs,
  onRemoveLog,
  onLoadSamples,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-white/15 rounded-3xl p-5 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Today's Water Log</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300">
                {logs.length} glasses
              </span>
            </h3>
            <p className="text-xs text-slate-400">Timeline of glasses drunk today</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Entries */}
        <div className="flex-1 overflow-y-auto pt-3 space-y-2 pr-1">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium">No water logged yet today</p>
              <p className="text-xs text-slate-500 mt-1">Tap any glass on the bottom dock to log a drink.</p>
              <button
                onClick={onLoadSamples}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-xs text-cyan-300 border border-cyan-400/20 transition-colors font-medium"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Load Sample Day (3 Glasses)
              </button>
            </div>
          ) : (
            logs.map((item) => {
              const cup = CUPS[item.cupId];
              const timeFormatted = new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-cyan-400/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Exact Glass Shape Icon filled with pure water */}
                    <div className="w-11 h-11 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-inner">
                      <GlassFallback2D cupId={item.cupId} fillRatio={1.0} className="w-full h-full" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{cup?.name || 'Water Glass'}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/20">
                          {item.capacityOz} oz
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {timeFormatted} • {cup?.capacityMl || 295} ml pure water
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveLog(item.id)}
                    title="Remove entry"
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        {logs.length > 0 && (
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={onClearAll}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Reset Today's Shelf
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
