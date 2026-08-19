export type CupId = 'tall-10oz' | 'bulbous-10oz' | 'rocks-8oz';

export interface CupDefinition {
  id: CupId;
  name: string;
  shortName: string;
  subtitle: string;
  capacityOz: number;
  capacityMl: number;
  description: string;
  proportions: {
    height: number;
    baseRadius: number;
    maxRadius: number;
    rimRadius: number;
    solidBaseHeight: number;
    liquidMaxHeight: number;
    liquidStartHeight: number;
  };
  features: string[];
  colorTint: string;
}

export interface DrinkLogEntry {
  id: string;
  cupId: CupId;
  capacityOz: number;
  timestamp: number; // Date.now()
  dateString: string; // YYYY-MM-DD
}

export interface DayRecord {
  dateString: string;
  entries: DrinkLogEntry[];
  totalOz: number;
  targetOz: number;
  isGoalMet: boolean;
}

export interface HydrationState {
  dailyTargetOz: number;
  logs: DrinkLogEntry[];
  streakDays: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  selectedCupForPouring: CupId | null;
  isPouringActive: boolean;
}
