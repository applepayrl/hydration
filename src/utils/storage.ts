import { CupDefinition, CupId, DrinkLogEntry, HydrationState } from '../types/hydration';

export const CUPS: Record<CupId, CupDefinition> = {
  'tall-10oz': {
    id: 'tall-10oz',
    name: 'Tall Glass',
    shortName: 'Tall Glass',
    subtitle: 'Weighted crystal base',
    capacityOz: 10,
    capacityMl: 295,
    description: 'Tall 10 oz pure water glass with an ultra-thick weighted crystal base.',
    proportions: {
      height: 2.3,
      baseRadius: 0.46,
      maxRadius: 0.48,
      rimRadius: 0.48,
      solidBaseHeight: 0.42,
      liquidMaxHeight: 2.18,
      liquidStartHeight: 0.42,
    },
    features: ['10 oz capacity', 'Slender tall silhouette', 'Weighted solid crystal base'],
    colorTint: '#38bdf8',
  },
  'bulbous-10oz': {
    id: 'bulbous-10oz',
    name: 'Teardrop Glass',
    shortName: 'Teardrop Glass',
    subtitle: 'Contoured curved profile',
    capacityOz: 10,
    capacityMl: 295,
    description: 'Ergonomic 10 oz teardrop water glass with curved contour and tapered rim.',
    proportions: {
      height: 1.55,
      baseRadius: 0.40,
      maxRadius: 0.65,
      rimRadius: 0.46,
      solidBaseHeight: 0.16,
      liquidMaxHeight: 1.44,
      liquidStartHeight: 0.16,
    },
    features: ['10 oz capacity', 'Contoured ergonomic belly', 'Tapered smooth rim'],
    colorTint: '#0ea5e9',
  },
  'rocks-8oz': {
    id: 'rocks-8oz',
    name: 'Classic Glass',
    shortName: 'Classic Glass',
    subtitle: 'Everyday clean silhouette',
    capacityOz: 8,
    capacityMl: 240,
    description: 'Classic 8 oz wide-mouth water glass with flat crystal base.',
    proportions: {
      height: 1.25,
      baseRadius: 0.54,
      maxRadius: 0.56,
      rimRadius: 0.56,
      solidBaseHeight: 0.14,
      liquidMaxHeight: 1.16,
      liquidStartHeight: 0.14,
    },
    features: ['8 oz capacity', 'Wide mouth opening', 'Classic sturdy silhouette'],
    colorTint: '#0284c7',
  },
};

export const CUP_LIST: CupDefinition[] = Object.values(CUPS);

const STORAGE_KEY = 'aquaflow_hydration_state_v1';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadHydrationState(): HydrationState {
  const defaultState: HydrationState = {
    dailyTargetOz: 64,
    logs: [],
    streakDays: 1,
    soundEnabled: true,
    hapticsEnabled: true,
    selectedCupForPouring: null,
    isPouringActive: false,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      selectedCupForPouring: null,
      isPouringActive: false,
    };
  } catch (e) {
    console.error('Failed to load hydration state from storage', e);
    return defaultState;
  }
}

export function saveHydrationState(state: HydrationState) {
  try {
    const { selectedCupForPouring, isPouringActive, ...toPersist } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch (e) {
    console.error('Failed to save hydration state to storage', e);
  }
}

export function getTodayLogs(logs: DrinkLogEntry[], dateStr: string = getTodayDateString()): DrinkLogEntry[] {
  return logs.filter((log) => log.dateString === dateStr);
}

export function calculateDailyIntake(logs: DrinkLogEntry[], dateStr: string = getTodayDateString()) {
  const todayLogs = getTodayLogs(logs, dateStr);
  const totalOz = todayLogs.reduce((sum, item) => sum + item.capacityOz, 0);
  const totalMl = Math.round(totalOz * 29.5735);
  return { totalOz, totalMl, count: todayLogs.length };
}

export function generateSampleLogs(): DrinkLogEntry[] {
  const today = getTodayDateString();
  const now = Date.now();
  return [
    {
      id: 'sample-1',
      cupId: 'tall-10oz',
      capacityOz: 10,
      timestamp: now - 1000 * 60 * 180,
      dateString: today,
    },
    {
      id: 'sample-2',
      cupId: 'bulbous-10oz',
      capacityOz: 10,
      timestamp: now - 1000 * 60 * 105,
      dateString: today,
    },
    {
      id: 'sample-3',
      cupId: 'rocks-8oz',
      capacityOz: 8,
      timestamp: now - 1000 * 60 * 30,
      dateString: today,
    },
  ];
}
