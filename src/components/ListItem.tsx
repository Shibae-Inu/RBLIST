import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  Info,
  ChevronUp,
  ChevronDown,
  Menu,
  Trash2,
  Pencil,
} from 'lucide-react';
import { TodoItem, TallySize, ThemeMode } from '../types';
import { sound } from '../utils/audio';

interface ListItemProps {
  item: TodoItem;
  isEditing: boolean;
  onTogglePick: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onDelete: (id: string) => void;
  onOpenDetails: (item: TodoItem) => void;
  onUpdateName?: (id: string, newName: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  tallySize?: TallySize;
  theme?: ThemeMode;
  existingNames?: string[];
  isTallyOpen?: boolean;
  onToggleTally?: (id: string) => void;
}

export const ListItem: React.FC<ListItemProps> = ({
  item,
  isEditing,
  onTogglePick,
  onUpdateQty,
  onDelete,
  onOpenDetails,
  onUpdateName,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  tallySize = 'large',
  theme = 'dark',
  existingNames = [],
  isTallyOpen,
  onToggleTally,
}) => {
  const [internalShowTally, setInternalShowTally] = useState<boolean>(false);
  const showTally = isTallyOpen !== undefined ? isTallyOpen : internalShowTally;
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isInlineEditing, setIsInlineEditing] = useState<boolean>(false);
  const [inlineName, setInlineName] = useState<string>(item.name);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';
  const isCompleted = item.picked;

  // Sync inline name when item prop updates
  useEffect(() => {
    setInlineName(item.name);
  }, [item.name]);

  // Focus and select input text when entering inline edit mode
  useEffect(() => {
    if (isInlineEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isInlineEditing]);

  const handleSaveInline = () => {
    const trimmed = inlineName.trim();
    if (trimmed && trimmed.toLowerCase() !== item.name.trim().toLowerCase()) {
      // Check duplicate
      const isDup = existingNames.some(
        (n) => n.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (isDup) {
        sound.playTallyDown();
        setInlineError(`"${trimmed}" already exists`);
        setInlineName(item.name);
        setTimeout(() => setInlineError(null), 3000);
        setIsInlineEditing(false);
        return;
      }

      sound.playClick();
      onUpdateName?.(item.id, trimmed);
    } else {
      setInlineName(item.name);
    }
    setIsInlineEditing(false);
  };

  const handleCancelInline = () => {
    setInlineName(item.name);
    setIsInlineEditing(false);
  };

  // Swipe-to-delete touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing || isInlineEditing) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || isEditing || isInlineEditing) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (diff < 0) {
      setSwipeOffset(Math.max(diff, -90));
    } else if (swipeOffset < 0) {
      setSwipeOffset(Math.min(0, swipeOffset + diff));
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset < -45) {
      setSwipeOffset(-80);
    } else {
      setSwipeOffset(0);
    }
    touchStartX.current = null;
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTallyUp();
    onUpdateQty(item.id, 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.quantity <= 1) return;
    sound.playTallyDown();
    onUpdateQty(item.id, -1);
  };

  const handleToggleTally = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    if (onToggleTally) {
      onToggleTally(item.id);
    } else {
      setInternalShowTally((prev) => !prev);
    }
  };

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInlineEditing) {
      handleSaveInline();
    }
    sound.playCheck();
    onTogglePick(item.id);
  };

  // Sizing styles for tally stepper based on tallySize setting
  const getStepperButtonSize = () => {
    switch (tallySize) {
      case 'compact':
        return 'w-7 h-7 sm:w-8 sm:h-8';
      case 'medium':
        return 'w-8 h-8 sm:w-9 sm:h-9';
      case 'large':
        return 'w-9 h-9 sm:w-10 sm:h-10';
      case 'xlarge':
        return 'w-11 h-11 sm:w-12 sm:h-12';
    }
  };

  const getChevronSize = () => {
    switch (tallySize) {
      case 'compact':
        return 'w-4 h-4 stroke-[2.2]';
      case 'medium':
        return 'w-4.5 h-4.5 stroke-[2.5]';
      case 'large':
        return 'w-5 h-5 sm:w-6 sm:h-6 stroke-[2.8]';
      case 'xlarge':
        return 'w-6 h-6 sm:w-7 sm:h-7 stroke-[3]';
    }
  };

  const getQtyBadgePadding = () => {
    switch (tallySize) {
      case 'compact':
        return 'px-1.5 py-0.5 text-xs';
      case 'medium':
        return 'px-2 py-0.5 text-xs sm:text-sm';
      case 'large':
        return 'px-2 py-1 text-sm';
      case 'xlarge':
        return 'px-2.5 py-1 text-base';
    }
  };

  return (
    <div
      className={`relative overflow-hidden border-b transition-colors ${
        isDark ? 'border-[#262732]' : 'border-slate-100'
      }`}
    >
      {/* Background action revealed on swipe-to-delete */}
      <div className="absolute inset-y-0 right-0 w-24 bg-rose-600 flex items-center justify-end pr-5 text-white font-medium">
        <button
          type="button"
          onClick={() => {
            sound.playTallyDown();
            onDelete(item.id);
          }}
          className="flex flex-col items-center gap-0.5 cursor-pointer"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-[10px] uppercase font-bold">Delete</span>
        </button>
      </div>

      {/* Main item row */}
      <div
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative z-10 px-4 py-3 flex items-center justify-between transition-colors ${
          swipeOffset < 0
            ? isDark
              ? 'bg-[#181920]'
              : 'bg-slate-50'
            : isDark
            ? 'bg-[#1D1E24] hover:bg-[#23242C]'
            : 'bg-white hover:bg-slate-50/80'
        }`}
      >
        {/* Left: Circle Checkbox & Item Name / Inline Editor */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
          {/* Circular checkbox matching exact styling */}
          <button
            type="button"
            onClick={handleCheckClick}
            aria-label={isCompleted ? `Unpick ${item.name}` : `Pick ${item.name}`}
            className="flex-shrink-0 cursor-pointer active:scale-90 transition-transform"
          >
            {isCompleted ? (
              <div className="w-5 h-5 rounded-full bg-[#35C2B6] flex items-center justify-center shadow-xs">
                <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
              </div>
            ) : (
              <div
                className={`w-5 h-5 rounded-full border-2 transition-colors ${
                  isDark
                    ? 'border-zinc-500 hover:border-[#35C2B6]'
                    : 'border-slate-300 hover:border-[#35C2B6]'
                }`}
              />
            )}
          </button>

          {/* Name & metadata OR Inline Text Input */}
          {isInlineEditing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveInline();
              }}
              className="flex items-center gap-1.5 flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={inputRef}
                type="text"
                value={inlineName}
                onChange={(e) => setInlineName(e.target.value)}
                onBlur={handleSaveInline}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleCancelInline();
                  }
                }}
                className={`w-full px-2.5 py-1 rounded-lg text-[15px] sm:text-[16px] font-medium border focus:outline-none transition-all shadow-xs ${
                  isDark
                    ? 'bg-[#14151C] border-[#35C2B6] text-zinc-100 ring-1 ring-[#35C2B6]'
                    : 'bg-white border-[#35C2B6] text-slate-900 ring-1 ring-[#35C2B6]'
                }`}
                placeholder="Item name..."
              />
              <button
                type="submit"
                onMouseDown={(e) => e.preventDefault()}
                className="p-1.5 rounded-lg bg-[#35C2B6] text-white hover:bg-[#2EB3A8] transition-all active:scale-90 cursor-pointer shadow-xs flex-shrink-0"
                title="Save"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </form>
          ) : (
            <div
              onClick={() => {
                if (!isEditing) {
                  sound.playClick();
                  setIsInlineEditing(true);
                }
              }}
              className="flex-1 min-w-0 cursor-pointer group/name py-0.5"
              title="Click directly to edit text"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-[15px] sm:text-[16px] tracking-tight truncate transition-colors ${
                    isCompleted
                      ? isDark
                        ? 'line-through text-zinc-400 opacity-80 font-normal'
                        : 'line-through text-slate-400 opacity-80 font-normal'
                      : isDark
                      ? 'text-zinc-100 font-medium group-hover/name:text-teal-300'
                      : 'text-slate-800 font-medium group-hover/name:text-teal-600'
                  }`}
                >
                  {item.name}
                </span>

                {/* Subtle edit pencil icon on hover indicating direct text edit */}
                {inlineError ? (
                  <span className="text-[11px] text-rose-400 font-semibold bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30 animate-pulse shrink-0">
                    ⚠️ Duplicate not allowed
                  </span>
                ) : (
                  !isEditing && (
                    <Pencil className="w-3 h-3 text-zinc-500 opacity-0 group-hover/name:opacity-70 transition-opacity flex-shrink-0" />
                  )
                )}

                {item.unit && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded font-normal ${
                      isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.unit}
                  </span>
                )}
              </div>
              {item.notes && (
                <p
                  className={`text-xs truncate mt-0.5 ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
                  }`}
                >
                  {item.notes}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right side controls: Qty tally + Steppers or Info button or Drag handle */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Quantity tally display - toggles tally buttons */}
          <button
            type="button"
            data-tally-control="true"
            onClick={handleToggleTally}
            className={`flex items-center gap-1.5 transition-all duration-250 ease-out rounded-md border cursor-pointer active:scale-95 ${getQtyBadgePadding()} ${
              showTally
                ? isDark
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-xs ring-1 ring-teal-500/30'
                  : 'bg-teal-50 text-teal-700 border-teal-300 shadow-xs ring-1 ring-teal-400/30'
                : isDark
                ? 'bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-700/40'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border-slate-200'
            }`}
            title={showTally ? 'Hide tally controls' : 'Show tally controls'}
            aria-expanded={showTally}
            aria-label={`Quantity: ${item.quantity}. Tap to ${showTally ? 'hide' : 'show'} tally adjustment buttons`}
          >
            <span className="tracking-tight font-medium flex items-center gap-1">
              <span>Qty:</span>
              <span
                className={`font-bold ml-0.5 transition-colors duration-200 ${
                  showTally
                    ? isDark
                      ? 'text-teal-200'
                      : 'text-teal-900'
                    : isDark
                    ? 'text-zinc-100'
                    : 'text-slate-900'
                }`}
              >
                {item.quantity}
              </span>
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  showTally
                    ? 'bg-teal-400 scale-100 opacity-100 ml-0.5'
                    : 'bg-transparent scale-0 opacity-0 w-0 -mr-1'
                }`}
              />
            </span>
          </button>

          {/* Large Tally Stepper Selector - Smoothly slides and transitions out from behind Qty: X */}
          {!isEditing && (
            <div
              data-tally-control="true"
              className={`flex items-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                showTally
                  ? 'max-w-[140px] opacity-100 translate-x-0 ml-1'
                  : 'max-w-0 opacity-0 -translate-x-3 ml-0 pointer-events-none'
              }`}
              aria-hidden={!showTally}
            >
              <div className="flex items-center gap-1.5 flex-shrink-0 py-0.5">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={item.quantity <= 1 || !showTally}
                  tabIndex={showTally ? 0 : -1}
                  aria-label="Decrease quantity"
                  title="Decrease tally"
                  className={`${getStepperButtonSize()} flex items-center justify-center rounded-lg border transition-all duration-150 active:scale-90 cursor-pointer shadow-xs disabled:opacity-20 ${
                    isDark
                      ? 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border-zinc-700/70'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  <ChevronDown className={getChevronSize()} />
                </button>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={!showTally}
                  tabIndex={showTally ? 0 : -1}
                  aria-label="Increase quantity"
                  title="Increase tally"
                  className={`${getStepperButtonSize()} flex items-center justify-center rounded-lg border transition-all duration-150 active:scale-90 cursor-pointer shadow-xs ${
                    isDark
                      ? 'bg-zinc-800/90 hover:bg-zinc-700 text-teal-400 hover:text-teal-300 border-teal-500/30 hover:border-teal-500/50'
                      : 'bg-teal-50 hover:bg-teal-100 text-teal-600 hover:text-teal-700 border-teal-300'
                  }`}
                >
                  <ChevronUp className={getChevronSize()} />
                </button>
              </div>
            </div>
          )}

          {/* If Editing Mode: Show Reorder handle & Delete button */}
          {isEditing ? (
            <div className="flex items-center gap-1.5 ml-1">
              {/* Quick Move Up/Down */}
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={onMoveUp}
                  className={`p-0.5 disabled:opacity-20 ${
                    isDark ? 'text-zinc-500 hover:text-zinc-200' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isLast}
                  onClick={onMoveDown}
                  className={`p-0.5 disabled:opacity-20 ${
                    isDark ? 'text-zinc-500 hover:text-zinc-200' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Drag Handle Icon */}
              <div className={`p-1 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>
                <Menu className="w-4 h-4" />
              </div>

              {/* Quick direct delete in edit mode */}
              <button
                type="button"
                onClick={() => {
                  sound.playTallyDown();
                  onDelete(item.id);
                }}
                className={`p-1 rounded ml-1 cursor-pointer ${
                  isDark
                    ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40'
                    : 'text-rose-500 hover:text-rose-600 hover:bg-rose-50'
                }`}
                title="Delete item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Normal Mode: Info button (i) for full details */
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                onOpenDetails(item);
              }}
              aria-label={`Details for ${item.name}`}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ml-1 cursor-pointer ${
                isDark
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
              }`}
              title="Item details & notes"
            >
              <Info className="w-4 h-4 stroke-[1.8]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
