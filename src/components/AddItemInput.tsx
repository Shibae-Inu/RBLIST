import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Plus, Minus, X, Tag, AlertTriangle, Sparkles, Clock } from 'lucide-react';
import { sound } from '../utils/audio';
import { ThemeMode, TodoItem, PastEntry } from '../types';

interface AddItemInputProps {
  onAddItem: (name: string, quantity: number, category?: string) => void;
  categories: string[];
  theme?: ThemeMode;
  existingItems?: TodoItem[];
  pastEntries?: PastEntry[];
  onDismissSuggestion?: (name: string) => void;
}

export const AddItemInput: React.FC<AddItemInputProps> = ({
  onAddItem,
  categories = [],
  theme = 'dark',
  existingItems = [],
  pastEntries = [],
  onDismissSuggestion,
}) => {
  const [name, setName] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsListRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  const trimmedName = name.trim();
  const duplicateItem = existingItems.find(
    (i) => i.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );

  // Compute matching past entries suggestions, strictly excluding any items already listed
  const matchingSuggestions = useMemo(() => {
    // Set of lowercase names of items already present in the list (current or picked)
    const existingNameSet = new Set(
      existingItems.map((item) => item.name.trim().toLowerCase())
    );

    // Exclude any entry that is already listed
    const availablePastEntries = pastEntries.filter(
      (entry) => !existingNameSet.has(entry.name.trim().toLowerCase())
    );

    const query = trimmedName.toLowerCase();

    // If typing a query, filter by startsWith first, then includes
    if (query.length > 0) {
      const startsWithMatches: PastEntry[] = [];
      const includesMatches: PastEntry[] = [];

      for (const entry of availablePastEntries) {
        const entryNameLower = entry.name.trim().toLowerCase();
        if (entryNameLower === query) {
          // Exact match at top
          startsWithMatches.unshift(entry);
        } else if (entryNameLower.startsWith(query)) {
          startsWithMatches.push(entry);
        } else if (entryNameLower.includes(query)) {
          includesMatches.push(entry);
        }
      }

      return [...startsWithMatches, ...includesMatches].slice(0, 8);
    }

    // When focused but empty, show top 5 frequent/recent past entries that are not already listed
    if (isFocused) {
      return availablePastEntries.slice(0, 5);
    }

    return [];
  }, [trimmedName, pastEntries, isFocused, existingItems]);

  // Reset selected index when query or suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [name]);

  // Scroll active suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsListRef.current) {
      const activeEl = suggestionsListRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trimmedName) return;

    sound.playTallyUp();
    onAddItem(trimmedName, qty > 0 ? qty : 1, selectedCategory || undefined);
    setName('');
    setQty(1);
    setSelectedCategory('');
    setSelectedIndex(-1);
    // Keep focus for rapid addition
    inputRef.current?.focus();
  };

  const handleSelectSuggestion = (suggestion: PastEntry, autoAdd: boolean = false) => {
    sound.playClick();

    if (autoAdd) {
      // Direct 1-tap addition
      sound.playTallyUp();
      onAddItem(
        suggestion.name,
        qty > 0 ? qty : 1,
        suggestion.category || selectedCategory || undefined
      );
      setName('');
      setQty(1);
      setSelectedCategory('');
      setSelectedIndex(-1);
      inputRef.current?.focus();
    } else {
      // Fill into input form
      setName(suggestion.name);
      if (suggestion.category) {
        setSelectedCategory(suggestion.category);
      }
      setSelectedIndex(-1);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (matchingSuggestions.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < matchingSuggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      if (matchingSuggestions.length > 0) {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : matchingSuggestions.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < matchingSuggestions.length) {
        const chosen = matchingSuggestions[selectedIndex];
        handleSelectSuggestion(chosen, true);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      if (selectedIndex >= 0) {
        setSelectedIndex(-1);
      } else {
        setName('');
        setIsFocused(false);
        inputRef.current?.blur();
      }
    }
  };

  const handleClear = () => {
    setName('');
    setSelectedIndex(-1);
    sound.playClick();
    inputRef.current?.focus();
  };

  const handleQtyChange = (delta: number) => {
    sound.playClick();
    setQty((prev) => Math.max(1, Math.min(999, prev + delta)));
  };

  const isExpanded = isFocused || name.length > 0;

  // Helper to highlight matching text in suggestions
  const renderHighlightedText = (text: string, query: string) => {
    if (!query) return <span>{text}</span>;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerQuery);

    if (matchIndex === -1) return <span>{text}</span>;

    const before = text.substring(0, matchIndex);
    const match = text.substring(matchIndex, matchIndex + query.length);
    const after = text.substring(matchIndex + query.length);

    return (
      <span>
        {before}
        <span className="text-teal-400 font-bold underline underline-offset-2 decoration-teal-400/50">
          {match}
        </span>
        {after}
      </span>
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`transition-all duration-200 ease-out border-t ${
        isExpanded
          ? isDark
            ? 'p-4 bg-[#1b1c24] border-teal-500/40 shadow-lg shadow-teal-500/5'
            : 'p-4 bg-teal-50/40 border-teal-400/50 shadow-md shadow-teal-500/10'
          : isDark
          ? 'px-4 py-3 bg-[#191A20] border-[#2A2B34] hover:bg-[#1d1f27]'
          : 'px-4 py-3 bg-white border-slate-100 hover:bg-slate-50'
      }`}
    >
      {/* Primary Input Row */}
      <div className="flex items-center gap-3">
        {/* Animated Plus / Icon */}
        <button
          type="button"
          onClick={() => {
            if (!isFocused) {
              inputRef.current?.focus();
            }
          }}
          className={`shrink-0 rounded-full flex items-center justify-center transition-all duration-200 ${
            duplicateItem
              ? 'w-7 h-7 bg-amber-500 text-black shadow-xs scale-105'
              : isExpanded
              ? 'w-7 h-7 bg-teal-500 text-white shadow-xs scale-105'
              : isDark
              ? 'w-5 h-5 border border-dashed border-zinc-600 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500'
              : 'w-5 h-5 border border-dashed border-slate-400 text-slate-400 hover:text-slate-600 hover:border-slate-500'
          }`}
        >
          {duplicateItem ? (
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <Plus
              className={`transition-transform duration-200 ${
                isExpanded ? 'w-4 h-4 stroke-[2.5]' : 'w-3.5 h-3.5'
              }`}
            />
          )}
        </button>

        {/* Text Input with Expansion */}
        <div className="flex-1 min-w-0 relative">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // slight delay so clicks on suggestions/category/quantity chips can fire before collapse
              setTimeout(() => {
                if (!name.trim()) {
                  setIsFocused(false);
                }
              }, 220);
            }}
            onKeyDown={handleKeyDown}
            placeholder={isExpanded ? 'Type item name (shows past suggestions)...' : 'add item'}
            className={`bg-transparent focus:outline-none w-full transition-all duration-200 ${
              isExpanded
                ? isDark
                  ? 'text-[16px] sm:text-[17px] font-medium text-white placeholder-zinc-500 py-1'
                  : 'text-[16px] sm:text-[17px] font-medium text-slate-900 placeholder-slate-400 py-1'
                : isDark
                ? 'text-[15px] text-zinc-100 placeholder-zinc-500'
                : 'text-[15px] text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Clear Button when text entered */}
        {name.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className={`p-1 rounded-full transition-colors cursor-pointer ${
              isDark
                ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
            }`}
            title="Clear text"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Quick Add Button if not expanded yet but has text */}
        {!isExpanded && trimmedName && (
          <button
            type="submit"
            className={`${
              duplicateItem
                ? 'bg-amber-500 hover:bg-amber-600 text-black'
                : 'bg-[#35C2B6] hover:bg-[#2EB3A8] text-white'
            } text-xs px-3 py-1 rounded-md font-medium transition-all active:scale-95 cursor-pointer shadow-xs`}
          >
            {duplicateItem ? `+${qty} to Existing` : 'Add'}
          </button>
        )}
      </div>

      {/* Suggestion Dropdown Panel (Inline, Prevents Overflow Clipping on Mobile) */}
      {isExpanded && matchingSuggestions.length > 0 && (
        <div
          onMouseDown={(e) => e.preventDefault()} // Keeps input focus when clicking suggestions
          className={`mt-2.5 rounded-xl border p-2 transition-all duration-150 animate-in fade-in duration-100 ${
            isDark
              ? 'bg-[#15161D] border-zinc-700/80 shadow-md'
              : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold border-b border-zinc-700/30 dark:border-zinc-800/80 pb-1 mb-1.5">
            <span
              className={`flex items-center gap-1.5 ${
                isDark ? 'text-zinc-400' : 'text-slate-500'
              }`}
            >
              {trimmedName ? (
                <>
                  <Sparkles className="w-3 h-3 text-teal-400 shrink-0" />
                  <span>Matching past entries</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Recent &amp; frequently used entries</span>
                </>
              )}
            </span>
            <span
              className={`text-[10px] hidden sm:inline-block font-normal ${
                isDark ? 'text-zinc-500' : 'text-slate-400'
              }`}
            >
              &uarr;&darr; keys to navigate &bull; Enter to select
            </span>
          </div>

          {/* List of Suggestions */}
          <div
            ref={suggestionsListRef}
            className="max-h-48 overflow-y-auto space-y-1 pr-0.5"
          >
            {matchingSuggestions.map((item, idx) => {
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={`${item.name}-${idx}`}
                  onClick={() => handleSelectSuggestion(item, true)}
                  className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer select-none ${
                    isSelected
                      ? isDark
                        ? 'bg-teal-500/20 text-teal-200 border border-teal-500/40 font-medium'
                        : 'bg-teal-50 text-teal-900 border border-teal-300 font-medium'
                      : isDark
                      ? 'hover:bg-zinc-800/80 text-zinc-200'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  {/* Left: Item name & category / unit badges */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate font-medium">
                      {renderHighlightedText(item.name, trimmedName)}
                    </span>

                    {item.category && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 font-normal ${
                          isDark
                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.category}
                      </span>
                    )}

                    {item.unit && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 font-normal ${
                          isDark
                            ? 'bg-zinc-800/60 text-zinc-400'
                            : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {item.unit}
                      </span>
                    )}
                  </div>

                  {/* Right: Quick Add Action & Dismiss Option */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSuggestion(item, true);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 transition-transform active:scale-95 cursor-pointer ${
                        isDark
                          ? 'bg-teal-500/20 hover:bg-teal-500 text-teal-300 hover:text-white'
                          : 'bg-teal-50 hover:bg-teal-500 text-teal-700 hover:text-white'
                      }`}
                      title="Click to add immediately"
                    >
                      <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
                      Add
                    </button>

                    {onDismissSuggestion && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onDismissSuggestion(item.name);
                        }}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isDark
                            ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-500/20'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-100'
                        }`}
                        title="Remove from suggestions"
                        aria-label={`Remove ${item.name} from suggestions`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expanded Controls Drawer on Focus */}
      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t border-dashed border-zinc-700/40 dark:border-zinc-700/50 flex flex-col gap-3 animate-fadeIn">
          {/* Duplicate Entry Alert Banner */}
          {duplicateItem && (
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 text-xs animate-in fade-in duration-150 ${
                isDark
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  : 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    &ldquo;{duplicateItem.name}&rdquo; already exists in{' '}
                    <span className="underline decoration-amber-400/50 font-bold">
                      {duplicateItem.picked ? 'Picked list' : 'Current list'}
                    </span>
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Duplicate entries are not allowed. Adding will add +{qty} to its existing quantity ({duplicateItem.quantity} &rarr; {duplicateItem.quantity + qty}) and unpick if needed.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                No Duplicates
              </span>
            </div>
          )}

          {/* Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Quantity Controls & Quick Presets */}
            <div className="flex items-center flex-wrap gap-2">
              <span
                className={`text-xs font-medium ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                Qty:
              </span>

              {/* Stepper with +/- */}
              <div
                className={`inline-flex items-center rounded-lg border overflow-hidden ${
                  isDark
                    ? 'bg-zinc-800/90 border-zinc-700 text-zinc-200'
                    : 'bg-white border-slate-300 text-slate-800 shadow-2xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleQtyChange(-1)}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                  }`}
                  title="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <input
                  type="number"
                  min={1}
                  max={999}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 bg-transparent text-center font-bold text-sm focus:outline-none text-teal-400 px-1 py-1"
                />

                <button
                  type="button"
                  onClick={() => handleQtyChange(1)}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                  }`}
                  title="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Quantity Chips */}
              <div className="flex items-center gap-1 ml-1">
                {[1, 2, 5, 10].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setQty(preset);
                    }}
                    className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      qty === preset
                        ? 'bg-teal-500 text-white shadow-2xs'
                        : isDark
                        ? 'bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setName('');
                  setSelectedIndex(-1);
                  setIsFocused(false);
                  inputRef.current?.blur();
                }}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!trimmedName}
                className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm ${
                  !trimmedName
                    ? isDark
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    : duplicateItem
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                    : 'bg-[#35C2B6] hover:bg-[#2EB3A8] text-white shadow-teal-500/20'
                }`}
              >
                {duplicateItem ? (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    Add +{qty} to Existing Item
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    Add Item
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Optional Category chips if categories exist */}
          {categories.length > 0 && (
            <div className="w-full flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
              <span
                className={`text-[11px] flex items-center gap-1 shrink-0 ${
                  isDark ? 'text-zinc-500' : 'text-slate-400'
                }`}
              >
                <Tag className="w-3 h-3" /> Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSelectedCategory((prev) => (prev === cat ? '' : cat));
                  }}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 font-medium'
                      : isDark
                      ? 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  );
};
