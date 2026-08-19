import React, { useState, useEffect } from 'react';
import { CupId, DrinkLogEntry, HydrationState } from './types/hydration';
import {
  CUPS,
  loadHydrationState,
  saveHydrationState,
  getTodayDateString,
  calculateDailyIntake,
  generateSampleLogs,
} from './utils/storage';
import { soundEngine } from './utils/audio';
import { IPhoneFrame } from './components/ui/IPhoneFrame';
import { IntakeHeader } from './components/ui/IntakeHeader';
import { DrinkBoardScene } from './components/3d/DrinkBoardScene';
import { GlassPickerDock } from './components/ui/GlassPickerDock';
import { CinematicPourScene } from './components/3d/CinematicPourScene';
import { DrinkHistoryModal } from './components/ui/DrinkHistoryModal';
import { GoalSettingsModal } from './components/ui/GoalSettingsModal';
import { CelebrationOverlay } from './components/ui/CelebrationOverlay';

export function App() {
  const [state, setState] = useState<HydrationState>(() => loadHydrationState());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modals state
  const [selectedCupForPour, setSelectedCupForPour] = useState<CupId | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [hasCelebratedToday, setHasCelebratedToday] = useState(false);

  // Persist state
  useEffect(() => {
    saveHydrationState(state);
    soundEngine.setMuted(!state.soundEnabled);
  }, [state]);

  // Today's stats
  const today = getTodayDateString();
  const todayLogs = state.logs.filter((l) => l.dateString === today);
  const { totalOz, totalMl } = calculateDailyIntake(state.logs, today);

  // Handle logging a new drink
  const handleStartDrink = (cupId: CupId) => {
    setSelectedCupForPour(cupId);
  };

  const handleFinishDrink = () => {
    if (!selectedCupForPour) return;
    const cup = CUPS[selectedCupForPour];
    const newEntry: DrinkLogEntry = {
      id: `drink-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      cupId: selectedCupForPour,
      capacityOz: cup.capacityOz,
      timestamp: Date.now(),
      dateString: today,
    };

    const newTotalOz = totalOz + cup.capacityOz;
    const justHitGoal = !hasCelebratedToday && totalOz < state.dailyTargetOz && newTotalOz >= state.dailyTargetOz;

    setState((prev) => ({
      ...prev,
      logs: [...prev.logs, newEntry],
    }));

    setSelectedCupForPour(null);

    if (justHitGoal) {
      setHasCelebratedToday(true);
      setTimeout(() => {
        setIsCelebrationOpen(true);
      }, 400);
    }
  };

  const handleRemoveLog = (id: string) => {
    setState((prev) => ({
      ...prev,
      logs: prev.logs.filter((item) => item.id !== id),
    }));
  };

  const handleLoadSamples = () => {
    const samples = generateSampleLogs();
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs.filter((l) => l.dateString !== today), ...samples],
    }));
    setIsHistoryOpen(false);
  };

  const handleResetToday = () => {
    setState((prev) => ({
      ...prev,
      logs: prev.logs.filter((l) => l.dateString !== today),
    }));
    setHasCelebratedToday(false);
  };

  const handleSaveTarget = (oz: number) => {
    setState((prev) => ({
      ...prev,
      dailyTargetOz: oz,
    }));
  };

  const handleToggleSound = () => {
    setState((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  const handleToggleHaptics = () => {
    setState((prev) => ({
      ...prev,
      hapticsEnabled: !prev.hapticsEnabled,
    }));
  };

  return (
    <IPhoneFrame
      isFullscreen={isFullscreen}
      onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
    >
      <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950">
        {/* Top Intake Summary & Controls */}
        <IntakeHeader
          totalOz={totalOz}
          targetOz={state.dailyTargetOz}
          totalMl={totalMl}
          streakDays={state.streakDays}
          soundEnabled={state.soundEnabled}
          onToggleSound={handleToggleSound}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Center 3D Interactive Drink Board Shelf with Multi-Tier Depth */}
        <div className="flex-1 w-full relative min-h-[260px] overflow-hidden">
          <DrinkBoardScene logs={todayLogs} />
        </div>

        {/* Bottom 3D Glass Picker Dock */}
        <GlassPickerDock
          onSelectCup={handleStartDrink}
          disabled={selectedCupForPour !== null}
        />

        {/* Fullscreen 3D Cinematic Pour Overlay */}
        {selectedCupForPour && (
          <CinematicPourScene
            cupId={selectedCupForPour}
            onComplete={handleFinishDrink}
            onCancel={() => setSelectedCupForPour(null)}
          />
        )}

        {/* Modals */}
        <DrinkHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          logs={todayLogs}
          onRemoveLog={handleRemoveLog}
          onLoadSamples={handleLoadSamples}
          onClearAll={handleResetToday}
        />

        <GoalSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          targetOz={state.dailyTargetOz}
          onSaveTarget={handleSaveTarget}
          soundEnabled={state.soundEnabled}
          onToggleSound={handleToggleSound}
          hapticsEnabled={state.hapticsEnabled}
          onToggleHaptics={handleToggleHaptics}
          onResetToday={handleResetToday}
        />

        <CelebrationOverlay
          isOpen={isCelebrationOpen}
          totalOz={totalOz}
          targetOz={state.dailyTargetOz}
          onClose={() => setIsCelebrationOpen(false)}
        />
      </div>
    </IPhoneFrame>
  );
}

export default App;
