export interface TodoItem {
  id: string;
  name: string;
  quantity: number;
  completedQuantity?: number;
  picked: boolean;
  category?: string;
  notes?: string;
  unit?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PickSession {
  id: string;
  date: string;
  timestamp: number;
  durationSeconds: number;
  totalItems: number;
  totalPickedItems: number;
  totalQuantity: number;
  items: TodoItem[];
  title?: string;
}

export interface PresetList {
  id: string;
  name: string;
  description: string;
  items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt' | 'picked'>[];
}

export interface PastEntry {
  name: string;
  category?: string;
  unit?: string;
  lastUsed?: number;
  frequency?: number;
}

export type TallySize = 'compact' | 'medium' | 'large' | 'xlarge';
export type ThemeMode = 'dark' | 'light';
export type FontFamily = 'sans' | 'rounded' | 'mono' | 'serif';
export type FontSize = 'small' | 'medium' | 'large';
export type ClickTone = 'classic' | 'mechanical' | 'pop' | 'blip';

export interface AppSettings {
  tallySize: TallySize;
  fontFamily: FontFamily;
  fontSize: FontSize;
  theme: ThemeMode;
  audioFeedback: boolean;
  audioVolume: number;
  clickTone: ClickTone;
  enableSuggestions?: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  tallySize: 'large',
  fontFamily: 'sans',
  fontSize: 'medium',
  theme: 'dark',
  audioFeedback: true,
  audioVolume: 0.7,
  clickTone: 'classic',
  enableSuggestions: true,
};
