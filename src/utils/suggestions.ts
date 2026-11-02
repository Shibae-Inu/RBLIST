import { TodoItem, PickSession, PresetList, PastEntry } from '../types';
import { PRESET_LISTS, INITIAL_ITEMS } from '../data/presets';

const STORAGE_KEY = 'picked_past_entries_v1';
const DISMISSED_KEY = 'picked_dismissed_suggestions_v1';
const FREQUENT_CLEARED_KEY = 'picked_frequent_cleared_at_v1';

/**
 * Retrieve persistent past entries from localStorage
 */
export const getStoredPastEntries = (): PastEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore error
  }
  return [];
};

/**
 * Save persistent past entries to localStorage
 */
export const saveStoredPastEntries = (entries: PastEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 150)));
  } catch {
    // Ignore error
  }
};

/**
 * Retrieve dismissed suggestion item names
 */
export const getDismissedSuggestions = (): string[] => {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore error
  }
  return [];
};

/**
 * Save dismissed suggestion item names
 */
export const saveDismissedSuggestions = (dismissed: string[]) => {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  } catch {
    // Ignore error
  }
};

/**
 * Dismiss an entry so it will not appear in suggestions
 */
export const dismissPastEntry = (name: string): void => {
  const norm = name.trim().toLowerCase();
  if (!norm) return;

  // 1. Remove from stored entries
  const current = getStoredPastEntries();
  const filtered = current.filter((e) => e.name.trim().toLowerCase() !== norm);
  saveStoredPastEntries(filtered);

  // 2. Add to dismissed suggestions list
  const dismissed = getDismissedSuggestions();
  if (!dismissed.some((d) => d.trim().toLowerCase() === norm)) {
    dismissed.push(norm);
    saveDismissedSuggestions(dismissed);
  }
};

/**
 * Restore all dismissed suggestions
 */
export const restoreDismissedSuggestions = (): void => {
  try {
    localStorage.removeItem(DISMISSED_KEY);
  } catch {
    // Ignore error
  }
};

/**
 * Get timestamp when frequently used entries were cleared
 */
export const getFrequentClearedAt = (): number => {
  try {
    const raw = localStorage.getItem(FREQUENT_CLEARED_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
};

/**
 * Clear frequently used entries by resetting all frequency counts to 1
 * and setting cleared timestamp marker so past sessions don't boost weights.
 * Also optionally dismisses specific frequent entries so they no longer appear in suggestions.
 */
export const clearFrequentEntries = (entriesToDismiss?: string[]): void => {
  // 1. Reset stored entries frequency to 1
  const stored = getStoredPastEntries();
  const reset = stored.map((entry) => ({
    ...entry,
    frequency: 1,
  }));
  saveStoredPastEntries(reset);

  // 2. Record timestamp marker
  try {
    localStorage.setItem(FREQUENT_CLEARED_KEY, String(Date.now()));
  } catch {
    // Ignore error
  }

  // 3. If specific entry names provided, dismiss them from suggestions
  if (entriesToDismiss && entriesToDismiss.length > 0) {
    entriesToDismiss.forEach((item) => dismissPastEntry(item));
  }
};

/**
 * Record a used item in the persistent past entries history
 */
export const recordPastEntry = (
  name: string,
  category?: string,
  unit?: string
): PastEntry[] => {
  const trimmed = name.trim();
  if (!trimmed) return getStoredPastEntries();

  // If item was previously dismissed, un-dismiss it since user actively used it
  const dismissed = getDismissedSuggestions();
  const norm = trimmed.toLowerCase();
  if (dismissed.some((d) => d.trim().toLowerCase() === norm)) {
    saveDismissedSuggestions(dismissed.filter((d) => d.trim().toLowerCase() !== norm));
  }

  const current = getStoredPastEntries();
  const existingIdx = current.findIndex((e) => e.name.trim().toLowerCase() === norm);

  if (existingIdx !== -1) {
    const existing = current[existingIdx];
    const updated: PastEntry = {
      ...existing,
      name: trimmed, // keep latest casing
      category: category || existing.category,
      unit: unit || existing.unit,
      frequency: (existing.frequency || 1) + 1,
      lastUsed: Date.now(),
    };
    current.splice(existingIdx, 1);
    current.unshift(updated);
  } else {
    current.unshift({
      name: trimmed,
      category,
      unit,
      frequency: 1,
      lastUsed: Date.now(),
    });
  }

  saveStoredPastEntries(current);
  return current;
};

/**
 * Clear all persistent past entries from localStorage
 */
export const clearStoredPastEntries = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(FREQUENT_CLEARED_KEY);
  } catch {
    // Ignore error
  }
};

/**
 * Return number of stored past entries in localStorage
 */
export const getStoredPastEntriesCount = (): number => {
  return getStoredPastEntries().length;
};

/**
 * Aggregate all past entries from:
 * 1. Built-in presets & initial items (optional)
 * 2. Custom presets
 * 3. Sessions history
 * 4. Stored user entries from localStorage
 * 5. Current & Picked items
 */
export const getAllPastEntries = (
  currentItems: TodoItem[] = [],
  sessions: PickSession[] = [],
  customPresets: PresetList[] = [],
  includeDefaults: boolean = false
): PastEntry[] => {
  const map = new Map<string, PastEntry>();
  const dismissedSet = new Set(
    getDismissedSuggestions().map((d) => d.trim().toLowerCase())
  );
  const frequentClearedAt = getFrequentClearedAt();

  const isDismissed = (name: string) => dismissedSet.has(name.trim().toLowerCase());

  // 1. Built-in presets and initial items (if enabled)
  if (includeDefaults) {
    PRESET_LISTS.forEach((preset) => {
      preset.items.forEach((item) => {
        if (isDismissed(item.name)) return;
        const key = item.name.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            name: item.name.trim(),
            category: item.category,
            unit: item.unit,
            frequency: frequentClearedAt > 0 ? 1 : 2,
            lastUsed: 1,
          });
        }
      });
    });

    INITIAL_ITEMS.forEach((item) => {
      if (isDismissed(item.name)) return;
      const key = item.name.trim().toLowerCase();
      const existing = map.get(key);
      const isPastSessionOrInitial = frequentClearedAt > 0 && item.createdAt <= frequentClearedAt;
      const addedFreq = isPastSessionOrInitial ? 0 : 1;
      map.set(key, {
        name: item.name.trim(),
        category: item.category || existing?.category,
        unit: item.unit || existing?.unit,
        frequency: (existing?.frequency || 1) + addedFreq,
        lastUsed: item.createdAt,
      });
    });
  }

  // 2. Custom presets
  customPresets.forEach((preset) => {
    preset.items.forEach((item) => {
      if (isDismissed(item.name)) return;
      const key = item.name.trim().toLowerCase();
      const existing = map.get(key);
      map.set(key, {
        name: item.name.trim(),
        category: item.category || existing?.category,
        unit: item.unit || existing?.unit,
        frequency: (existing?.frequency || 1) + (frequentClearedAt > 0 ? 0 : 2),
        lastUsed: Date.now(),
      });
    });
  });

  // 3. Past Sessions
  sessions.forEach((s) => {
    const isOldSession = frequentClearedAt > 0 && s.timestamp <= frequentClearedAt;
    s.items.forEach((item) => {
      if (isDismissed(item.name)) return;
      const key = item.name.trim().toLowerCase();
      const existing = map.get(key);
      const sessionFreqBonus = isOldSession ? 0 : 2;
      map.set(key, {
        name: item.name.trim(),
        category: item.category || existing?.category,
        unit: item.unit || existing?.unit,
        frequency: (existing?.frequency || 1) + sessionFreqBonus,
        lastUsed: Math.max(existing?.lastUsed || 0, s.timestamp),
      });
    });
  });

  // 4. Stored user entries from localStorage
  const stored = getStoredPastEntries();
  stored.forEach((entry) => {
    if (isDismissed(entry.name)) return;
    const key = entry.name.trim().toLowerCase();
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        name: entry.name.trim(),
        category: entry.category || existing.category,
        unit: entry.unit || existing.unit,
        frequency: (existing.frequency || 1) + (entry.frequency || 1),
        lastUsed: Math.max(existing.lastUsed || 0, entry.lastUsed || 0),
      });
    } else {
      map.set(key, entry);
    }
  });

  // 5. Current items in app
  currentItems.forEach((item) => {
    if (isDismissed(item.name)) return;
    const key = item.name.trim().toLowerCase();
    const existing = map.get(key);
    map.set(key, {
      name: item.name.trim(),
      category: item.category || existing?.category,
      unit: item.unit || existing?.unit,
      frequency: (existing?.frequency || 1) + 2,
      lastUsed: item.updatedAt || Date.now(),
    });
  });

  return Array.from(map.values()).sort((a, b) => {
    // Sort primarily by frequency, then lastUsed
    const freqDiff = (b.frequency || 0) - (a.frequency || 0);
    if (freqDiff !== 0) return freqDiff;
    return (b.lastUsed || 0) - (a.lastUsed || 0);
  });
};
