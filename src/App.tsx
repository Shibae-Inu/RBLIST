/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  CheckCircle,
  Trash2,
  Undo2,
  AlertTriangle,
} from 'lucide-react';

import { TodoItem, PickSession, PresetList, AppSettings, DEFAULT_SETTINGS, PastEntry } from './types';
import { INITIAL_ITEMS } from './data/presets';
import { sound } from './utils/audio';
import {
  getAllPastEntries,
  recordPastEntry,
  clearStoredPastEntries,
  getStoredPastEntriesCount,
  clearFrequentEntries,
  dismissPastEntry,
  getDismissedSuggestions,
  restoreDismissedSuggestions,
} from './utils/suggestions';
import { Header } from './components/Header';
import { ListItem } from './components/ListItem';
import { AddItemInput } from './components/AddItemInput';
import { ItemModal } from './components/ItemModal';
import { HistoryModal } from './components/HistoryModal';
import { PresetsModal } from './components/PresetsModal';
import { ClearPickedModal } from './components/ClearPickedModal';
import { SettingsModal } from './components/SettingsModal';

// Helper to ensure lists are strictly free of duplicate entries (case-insensitive)
const deduplicateItems = (list: TodoItem[]): TodoItem[] => {
  const seen = new Map<string, TodoItem>();
  for (const item of list) {
    const key = item.name.trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      seen.set(key, {
        ...existing,
        quantity: existing.quantity + item.quantity,
        // If either copy is unpicked, mark it unpicked in Current List
        picked: existing.picked && item.picked,
        updatedAt: Math.max(existing.updatedAt, item.updatedAt),
      });
    } else {
      seen.set(key, { ...item, name: item.name.trim() });
    }
  }
  return Array.from(seen.values());
};

export default function App() {
  // Persistence state
  const [items, setItems] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem('picked_items_v1');
      if (saved) {
        return deduplicateItems(JSON.parse(saved));
      }
    } catch {
      // Fallback
    }
    return deduplicateItems(INITIAL_ITEMS);
  });

  const [sessions, setSessions] = useState<PickSession[]>(() => {
    try {
      const saved = localStorage.getItem('picked_sessions_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [customPresets, setCustomPresets] = useState<PresetList[]>(() => {
    try {
      const saved = localStorage.getItem('picked_custom_presets_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return [];
  });

  // Settings State with LocalStorage persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('picked_settings_v2');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState<TodoItem[] | null>(null);
  const [undoMessage, setUndoMessage] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'warning' | 'success'>('info');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestionsKey, setSuggestionsKey] = useState(0);
  const [activeTallyId, setActiveTallyId] = useState<string | null>(null);

  const handleToggleTally = (id: string) => {
    setActiveTallyId((current) => (current === id ? null : id));
  };

  // Close any open tally when user taps a blank space or outside tally controls
  useEffect(() => {
    if (!activeTallyId) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-tally-control="true"]')) {
        return;
      }
      setActiveTallyId(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [activeTallyId]);

  const showToast = (message: string, type: 'info' | 'warning' | 'success' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage((curr) => (curr === message ? null : curr));
    }, 4500);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('picked_items_v1', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('picked_sessions_v1', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('picked_custom_presets_v1', JSON.stringify(customPresets));
  }, [customPresets]);

  useEffect(() => {
    localStorage.setItem('picked_settings_v2', JSON.stringify(settings));
    sound.setEnabled(settings.audioFeedback);
    sound.setVolume(settings.audioVolume);
    sound.setTone(settings.clickTone);
  }, [settings]);

  // Settings handlers
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    sound.setEnabled(DEFAULT_SETTINGS.audioFeedback);
    sound.setVolume(DEFAULT_SETTINGS.audioVolume);
    sound.setTone(DEFAULT_SETTINGS.clickTone);
  };

  // Derived item groups: categorized so that the oldest entry is at the top
  const currentItems = useMemo(() => {
    let list = items.filter((item) => !item.picked);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query)
      );
    }
    // Ascending order of creation timestamp ensures the oldest entry is at the top
    return [...list].sort((a, b) => a.createdAt - b.createdAt);
  }, [items, searchQuery]);

  const pickedItems = useMemo(() => {
    const list = items.filter((item) => item.picked);
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Totals & Case Measurements (24 units = 1 case)
  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const pickedUnits = useMemo(
    () =>
      items
        .filter((item) => item.picked)
        .reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const currentUnits = useMemo(
    () =>
      items
        .filter((item) => !item.picked)
        .reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const currentCases = useMemo(
    () => Math.round(currentUnits / 24),
    [currentUnits]
  );
  const pickedCases = useMemo(
    () => Math.round(pickedUnits / 24),
    [pickedUnits]
  );
  const totalCases = useMemo(
    () => Math.round(totalUnits / 24),
    [totalUnits]
  );

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [items]);

  // Aggregate past entries from history, presets, sessions, and items
  const pastEntries = useMemo(() => {
    if (settings.enableSuggestions === false) return [];
    return getAllPastEntries(
      items,
      sessions,
      customPresets,
      false
    );
  }, [
    items,
    sessions,
    customPresets,
    settings.enableSuggestions,
    suggestionsKey,
  ]);

  // Frequent entries derived from suggestions
  const frequentEntries = useMemo(() => {
    return pastEntries.filter((e) => (e.frequency || 1) > 1);
  }, [pastEntries]);

  // Count of items dismissed from suggestions
  const dismissedCount = useMemo(() => {
    return getDismissedSuggestions().length;
  }, [suggestionsKey]);

  const handleDismissSuggestion = (name: string) => {
    sound.playClick();
    dismissPastEntry(name);
    setSuggestionsKey((k) => k + 1);
    showToast(`Removed "${name}" from suggestions.`, 'info');
  };

  const handleClearFrequent = (entriesToDismiss?: string[]) => {
    sound.playTallyDown();
    clearFrequentEntries(entriesToDismiss);
    setSuggestionsKey((k) => k + 1);
    showToast('Cleared frequently used entries from suggestions.', 'info');
  };

  const handleRestoreDismissed = () => {
    sound.playClick();
    restoreDismissedSuggestions();
    setSuggestionsKey((k) => k + 1);
    showToast('Restored all hidden suggestion entries.', 'success');
  };

  // Actions
  const handleTogglePick = (id: string) => {
    if (activeTallyId === id) setActiveTallyId(null);
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      const nextPicked = !target?.picked;

      const updated = prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            picked: nextPicked,
            updatedAt: Date.now(),
          };
        }
        return item;
      });

      // If user just picked the last remaining item, trigger celebratory confetti
      const remaining = updated.filter((i) => !i.picked).length;
      if (nextPicked && remaining === 0 && updated.length > 0) {
        sound.playSuccess();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#35C2B6', '#FBBF24', '#ffffff', '#10B981'],
        });
      }

      return updated;
    });
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextQty = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: nextQty,
            updatedAt: Date.now(),
          };
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    if (activeTallyId === id) setActiveTallyId(null);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateName = (id: string, newName: string): boolean => {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    const norm = trimmed.toLowerCase();

    // Prevent duplicate entries
    const duplicate = items.find(
      (item) => item.id !== id && item.name.trim().toLowerCase() === norm
    );
    if (duplicate) {
      sound.playTallyDown();
      showToast(
        `Cannot rename to "${trimmed}": an entry named "${duplicate.name}" already exists. Duplicate entries are not allowed.`,
        'warning'
      );
      return false;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, name: trimmed, updatedAt: Date.now() } : item
      )
    );
    return true;
  };

  const handleAddItem = (name: string, quantity: number, category?: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const norm = trimmed.toLowerCase();

    // Prevent duplicate entries: if item already exists, add to its quantity rather than creating a duplicate
    const existingIndex = items.findIndex((i) => i.name.trim().toLowerCase() === norm);
    if (existingIndex !== -1) {
      const existing = items[existingIndex];
      sound.playTallyUp();
      setItems((prev) =>
        prev.map((it, idx) => {
          if (idx === existingIndex) {
            return {
              ...it,
              quantity: it.quantity + quantity,
              picked: false, // Move back to Current List if it was picked
              updatedAt: Date.now(),
            };
          }
          return it;
        })
      );
      recordPastEntry(existing.name, existing.category, existing.unit);
      showToast(
        `"${existing.name}" is already in your list! Added +${quantity} to its quantity (${existing.quantity + quantity} total) instead of creating a duplicate.`,
        'warning'
      );
      return;
    }

    const resolvedCategory = category || (currentItems[currentItems.length - 1]?.category || undefined);
    const newItem: TodoItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      quantity,
      picked: false,
      category: resolvedCategory,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    recordPastEntry(trimmed, resolvedCategory);
    // Append new item so that oldest entries remain on top
    setItems((prev) => [...prev, newItem]);
  };

  const handleSaveItemModal = (updated: TodoItem) => {
    const norm = updated.name.trim().toLowerCase();
    const duplicate = items.find(
      (item) => item.id !== updated.id && item.name.trim().toLowerCase() === norm
    );
    if (duplicate) {
      sound.playTallyDown();
      showToast(
        `Cannot save: an entry named "${duplicate.name}" already exists. Duplicate entries are not allowed.`,
        'warning'
      );
      return;
    }
    recordPastEntry(updated.name, updated.category, updated.unit);
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleMove = (index: number, direction: 'up' | 'down', isCurrent: boolean) => {
    sound.playClick();
    const sourceList = isCurrent ? [...currentItems] : [...pickedItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= sourceList.length) return;

    // Swap positions
    const [moved] = sourceList.splice(index, 1);
    sourceList.splice(targetIndex, 0, moved);

    const otherList = items.filter((i) => (isCurrent ? i.picked : !i.picked));
    setItems(isCurrent ? [...sourceList, ...otherList] : [...otherList, ...sourceList]);
  };

  const handleRestoreSession = (restoredItems: TodoItem[]) => {
    sound.playSuccess();
    setItems(
      deduplicateItems(
        restoredItems.map((item) => ({
          ...item,
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          picked: false,
        }))
      )
    );
    showToast('Restored session with deduplicated items.', 'success');
  };

  const handleLoadPreset = (
    presetItems: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt' | 'picked'>[]
  ) => {
    sound.playSuccess();
    const newItems: TodoItem[] = presetItems.map((item, idx) => ({
      ...item,
      id: `preset-item-${idx}-${Date.now()}`,
      picked: false,
      createdAt: Date.now() + idx,
      updatedAt: Date.now(),
    }));
    setItems(deduplicateItems(newItems));
  };

  const handleSaveCurrentAsPreset = (name: string, description: string) => {
    const newPreset: PresetList = {
      id: `custom-preset-${Date.now()}`,
      name,
      description,
      items: items.map(({ name, quantity, category, notes, unit }) => ({
        name,
        quantity,
        category,
        notes,
        unit,
      })),
    };
    setCustomPresets((prev) => [newPreset, ...prev]);
  };

  const handleMarkAllPicked = () => {
    sound.playSuccess();
    setItems((prev) => prev.map((i) => ({ ...i, picked: true })));
  };

  const handleUnpickAll = () => {
    const pickedToReset = items.filter((i) => i.picked);
    if (pickedToReset.length === 0) return;

    sound.playClick();
    setUndoSnapshot([...items]);
    setUndoMessage(`Moved ${pickedToReset.length} ${pickedToReset.length === 1 ? 'item' : 'items'} back to Current List`);
    setItems((prev) => prev.map((i) => ({ ...i, picked: false })));

    setTimeout(() => {
      setUndoSnapshot((curr) => (curr ? null : curr));
    }, 6000);
  };

  const handleDeletePicked = () => {
    const pickedToClear = items.filter((i) => i.picked);
    if (pickedToClear.length === 0) return;

    sound.playTallyDown();
    setUndoSnapshot([...items]);
    setUndoMessage(`Cleared ${pickedToClear.length} picked ${pickedToClear.length === 1 ? 'item' : 'items'}`);
    setItems((prev) => prev.filter((i) => !i.picked));

    setTimeout(() => {
      setUndoSnapshot((curr) => (curr ? null : curr));
    }, 6000);
  };

  const handleUndo = () => {
    if (undoSnapshot) {
      sound.playClick();
      setItems(undoSnapshot);
      setUndoSnapshot(null);
      setUndoMessage('');
    }
  };

  const isDark = settings.theme === 'dark';

  const fontClass =
    settings.fontFamily === 'sans'
      ? 'font-sans-custom'
      : settings.fontFamily === 'rounded'
      ? 'font-rounded-custom'
      : settings.fontFamily === 'mono'
      ? 'font-mono-custom'
      : 'font-serif-custom';

  const fontSizeClass =
    settings.fontSize === 'small'
      ? 'font-scale-small'
      : settings.fontSize === 'large'
      ? 'font-scale-large'
      : 'font-scale-medium';

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-start antialiased selection:bg-[#35C2B6]/30 transition-colors duration-150 ${fontClass} ${fontSizeClass} ${
        isDark ? 'bg-[#0E0F13] text-zinc-100' : 'bg-slate-100 text-slate-800'
      }`}
    >
      {/* Main App Container - Auto-adjusts to narrow cover screen, square unfolded foldable (Z Fold 7), and desktop */}
      <main
        className={`w-full max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl min-h-[100dvh] flex flex-col shadow-2xl relative transition-all duration-200 ${
          isDark ? 'bg-[#0F1015]' : 'bg-[#F8FAFC]'
        }`}
      >
        {/* App Header with Settings Button */}
        <Header
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(!isEditing)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Quick Search & Summary Row */}
        <div className="px-3 sm:px-4 md:px-6 pt-3 pb-1 flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search
              className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-zinc-500' : 'text-slate-400'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter items or categories..."
              className={`w-full border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#35C2B6] transition-colors ${
                isDark
                  ? 'bg-[#181920] border-zinc-800 text-zinc-200 placeholder-zinc-500'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-2xs'
              }`}
            />
          </div>

          {/* Quick Actions Dropdown / buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUnpickAll}
              title="Reset all items to unpicked"
              className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#1C1D25] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs'
              }`}
            >
              Unpick All
            </button>
            <button
              onClick={handleMarkAllPicked}
              title="Mark all items picked"
              className={`px-2 py-1 rounded text-[11px] transition-colors font-medium cursor-pointer ${
                isDark
                  ? 'bg-[#1C1D25] hover:bg-zinc-800 text-teal-400'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 shadow-2xs'
              }`}
            >
              Pick All
            </button>
          </div>
        </div>

        {/* Content Body: Auto-adjusts as single vertical stack on folded cover screen, dual-pane side-by-side on unfolded Z Fold & tablets */}
        <div className="px-3 sm:px-4 md:px-6 py-3 flex-1 overflow-y-auto">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-5 md:gap-6 items-start">
            {/* SECTION 1: Current List */}
            <section className="w-full min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[17px] font-bold text-[#FBBF24] tracking-tight">
                  Current List
                </h2>
                <span
                  className={`text-[11px] sm:text-xs font-medium ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}
                >
                  {currentItems.length} items &bull; {currentUnits}{' '}
                  {currentUnits === 1 ? 'can' : 'cans'} left &bull;{' '}
                  {currentCases} {currentCases === 1 ? 'case' : 'cases'}
                </span>
              </div>

              {/* Container Card */}
              <div
                className={`rounded-2xl border overflow-hidden shadow-lg transition-colors ${
                  isDark
                    ? 'bg-[#181920] border-[#272832]'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {currentItems.length === 0 ? (
                  <div
                    className={`px-4 py-8 text-center text-xs ${
                      isDark ? 'text-zinc-500' : 'text-slate-400'
                    }`}
                  >
                    {searchQuery ? (
                      <p>No unpicked items matching &ldquo;{searchQuery}&rdquo;</p>
                    ) : (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="w-8 h-8 text-teal-400 mb-1.5 opacity-80" />
                        <p
                          className={`font-semibold text-sm ${
                            isDark ? 'text-zinc-300' : 'text-slate-700'
                          }`}
                        >
                          All items picked!
                        </p>
                        <p className="mt-0.5 opacity-75">
                          Add more items below or view completed in Picked.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  currentItems.map((item, idx) => (
                    <ListItem
                      key={item.id}
                      item={item}
                      isEditing={isEditing}
                      onTogglePick={handleTogglePick}
                      onUpdateQty={handleUpdateQty}
                      onDelete={handleDeleteItem}
                      onOpenDetails={(it) => setSelectedItem(it)}
                      onUpdateName={handleUpdateName}
                      onMoveUp={() => handleMove(idx, 'up', true)}
                      onMoveDown={() => handleMove(idx, 'down', true)}
                      isFirst={idx === 0}
                      isLast={idx === currentItems.length - 1}
                      tallySize={settings.tallySize}
                      theme={settings.theme}
                      existingNames={items.filter((i) => i.id !== item.id).map((i) => i.name)}
                      isTallyOpen={activeTallyId === item.id}
                      onToggleTally={handleToggleTally}
                    />
                  ))
                )}

                {/* Inline "add item" row */}
                <AddItemInput
                  onAddItem={handleAddItem}
                  categories={availableCategories}
                  theme={settings.theme}
                  existingItems={items}
                  pastEntries={pastEntries}
                  onDismissSuggestion={handleDismissSuggestion}
                />
              </div>
            </section>

            {/* SECTION 2: Picked */}
            <section className="w-full min-w-0 pb-6 md:pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-[17px] font-bold text-[#FBBF24] tracking-tight">
                    Picked
                  </h2>
                  {pickedItems.length > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/25">
                      {pickedItems.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[11px] sm:text-xs font-medium ${
                      isDark ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  >
                    {pickedItems.length} items &bull; {pickedUnits}{' '}
                    {pickedUnits === 1 ? 'can' : 'cans'} picked &bull;{' '}
                    {pickedCases} {pickedCases === 1 ? 'case' : 'cases'}
                  </span>

                  {/* Option to clear in the picked category */}
                  {pickedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsClearModalOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-xs"
                      title="Clear options for picked items"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Picked Card */}
              <div
                className={`rounded-2xl border overflow-hidden shadow-lg transition-colors ${
                  isDark
                    ? 'bg-[#181920] border-[#272832]'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {pickedItems.length === 0 ? (
                  <div
                    className={`px-4 py-8 text-center text-xs ${
                      isDark ? 'text-zinc-500' : 'text-slate-400'
                    }`}
                  >
                    <p>No picked items yet.</p>
                    <p className="mt-0.5 opacity-75">
                      Tap the circle next to any item to mark it picked!
                    </p>
                  </div>
                ) : (
                  pickedItems.map((item, idx) => (
                    <ListItem
                      key={item.id}
                      item={item}
                      isEditing={isEditing}
                      onTogglePick={handleTogglePick}
                      onUpdateQty={handleUpdateQty}
                      onDelete={handleDeleteItem}
                      onOpenDetails={(it) => setSelectedItem(it)}
                      onUpdateName={handleUpdateName}
                      onMoveUp={() => handleMove(idx, 'up', false)}
                      onMoveDown={() => handleMove(idx, 'down', false)}
                      isFirst={idx === 0}
                      isLast={idx === pickedItems.length - 1}
                      tallySize={settings.tallySize}
                      theme={settings.theme}
                      existingNames={items.filter((i) => i.id !== item.id).map((i) => i.name)}
                      isTallyOpen={activeTallyId === item.id}
                      onToggleTally={handleToggleTally}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Bottom Status & Progress Footer */}
        <div
          className={`sticky bottom-0 z-20 px-3 sm:px-4 md:px-6 py-2.5 border-t backdrop-blur-md flex items-center justify-between transition-colors pb-[max(0.625rem,env(safe-area-inset-bottom))] ${
            isDark
              ? 'border-zinc-800/80 bg-[#121319]/90'
              : 'border-slate-200 bg-white/90 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-medium ${
                isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}
            >
              Progress:
            </span>
            <span className="text-xs font-bold text-teal-400">
              {pickedItems.length} of {items.length} items &bull; {pickedCases} of {totalCases} {totalCases === 1 ? 'case' : 'cases'}
            </span>
          </div>

          {/* Quick Progress Bar */}
          <div className="flex items-center gap-2">
            <div
              className={`w-24 sm:w-36 h-2 rounded-full overflow-hidden ${
                isDark ? 'bg-zinc-800' : 'bg-slate-200'
              }`}
            >
              <div
                className="h-full bg-[#35C2B6] transition-all duration-300"
                style={{
                  width: `${
                    items.length > 0
                      ? (items.filter((i) => i.picked).length / items.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <span
              className={`font-mono text-[11px] ${
                isDark ? 'text-zinc-300' : 'text-slate-600 font-semibold'
              }`}
            >
              {items.length > 0
                ? Math.round(
                    (items.filter((i) => i.picked).length / items.length) * 100
                  )
                : 0}
              %
            </span>
          </div>
        </div>
      </main>

      {/* Item Detail / Edit Modal */}
      {selectedItem && (
        <ItemModal
          item={selectedItem}
          isOpen={true}
          onClose={() => setSelectedItem(null)}
          onSave={handleSaveItemModal}
          onDelete={handleDeleteItem}
          availableCategories={availableCategories}
          existingNames={items.filter((i) => i.id !== selectedItem.id).map((i) => i.name)}
        />
      )}

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        onRestoreSession={handleRestoreSession}
        onClearHistory={() => setSessions([])}
        onDeleteSession={(id) => setSessions((prev) => prev.filter((s) => s.id !== id))}
      />

      {/* Presets Modal */}
      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onLoadPreset={handleLoadPreset}
        onSaveCurrentAsPreset={handleSaveCurrentAsPreset}
        customPresets={customPresets}
        onDeleteCustomPreset={(id) =>
          setCustomPresets((prev) => prev.filter((p) => p.id !== id))
        }
      />

      {/* Clear Picked Modal */}
      <ClearPickedModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        pickedCount={pickedItems.length}
        totalUnits={pickedUnits}
        onDeletePicked={handleDeletePicked}
        onUnpickAll={handleUnpickAll}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetSettings={handleResetSettings}
        sessionsCount={sessions.length}
        suggestionsCount={getStoredPastEntriesCount()}
        frequentCount={frequentEntries.length}
        frequentEntries={frequentEntries}
        dismissedCount={dismissedCount}
        onClearHistory={() => {
          sound.playTallyDown();
          setSessions([]);
          localStorage.removeItem('picked_sessions_v1');
          setSuggestionsKey((k) => k + 1);
          showToast('Cleared session history.', 'info');
        }}
        onClearSuggestions={() => {
          sound.playTallyDown();
          clearStoredPastEntries();
          setSuggestionsKey((k) => k + 1);
          showToast('Cleared saved autocomplete entries.', 'info');
        }}
        onClearFrequent={handleClearFrequent}
        onDismissSuggestion={handleDismissSuggestion}
        onRestoreDismissed={handleRestoreDismissed}
        onClearHistoryAndSuggestions={() => {
          sound.playTallyDown();
          setSessions([]);
          localStorage.removeItem('picked_sessions_v1');
          clearStoredPastEntries();
          restoreDismissedSuggestions();
          setSuggestionsKey((k) => k + 1);
          showToast('Cleared all history and suggestions.', 'success');
        }}
      />

      {/* Floating Duplicate/Validation Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-14 left-1/2 -translate-x-1/2 z-50 border shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-[92vw] ${
            toastType === 'warning'
              ? isDark
                ? 'bg-[#221B15] border-amber-500/50 text-amber-200'
                : 'bg-amber-50 border-amber-400 text-amber-900 shadow-amber-500/10'
              : toastType === 'success'
              ? isDark
                ? 'bg-[#142621] border-teal-500/50 text-teal-200'
                : 'bg-teal-50 border-teal-400 text-teal-900 shadow-teal-500/10'
              : isDark
              ? 'bg-[#1F202B] border-zinc-700 text-zinc-200'
              : 'bg-white border-slate-300 text-slate-800'
          }`}
        >
          {toastType === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : toastType === 'success' ? (
            <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-400 hover:text-zinc-200 text-xs ml-1 cursor-pointer shrink-0 p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Undo Banner */}
      {undoSnapshot && !toastMessage && (
        <div
          className={`fixed bottom-14 left-1/2 -translate-x-1/2 z-40 border shadow-2xl rounded-full px-4 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            isDark
              ? 'bg-[#1F202B] border-teal-500/40 text-zinc-200'
              : 'bg-white border-teal-500/50 text-slate-800'
          }`}
        >
          <span className="text-xs font-medium">{undoMessage}</span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 text-xs font-bold text-teal-300 hover:text-teal-200 bg-teal-500/20 hover:bg-teal-500/30 px-2.5 py-0.5 rounded-full transition-colors active:scale-95 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
          <button
            onClick={() => setUndoSnapshot(null)}
            className="text-zinc-500 hover:text-zinc-300 text-xs ml-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
