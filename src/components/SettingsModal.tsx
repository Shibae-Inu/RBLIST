import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Type,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Play,
  Check,
  WifiOff,
  Download,
  Smartphone,
  HardDrive,
  Info,
  History,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
} from 'lucide-react';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  TallySize,
  FontFamily,
  FontSize,
  ThemeMode,
  ClickTone,
  PastEntry,
} from '../types';
import { sound } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetSettings: () => void;
  totalItemsCount?: number;
  isInstallable?: boolean;
  isInstalled?: boolean;
  isIOS?: boolean;
  onInstall?: () => Promise<boolean>;
  sessionsCount?: number;
  suggestionsCount?: number;
  frequentCount?: number;
  frequentEntries?: PastEntry[];
  dismissedCount?: number;
  onClearHistory?: () => void;
  onClearSuggestions?: () => void;
  onClearHistoryAndSuggestions?: () => void;
  onClearFrequent?: (entriesToDismiss?: string[]) => void;
  onDismissSuggestion?: (name: string) => void;
  onRestoreDismissed?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
  totalItemsCount = 0,
  isInstallable = false,
  isInstalled = false,
  isIOS = false,
  onInstall,
  sessionsCount = 0,
  suggestionsCount = 0,
  frequentCount = 0,
  frequentEntries = [],
  dismissedCount = 0,
  onClearHistory,
  onClearSuggestions,
  onClearHistoryAndSuggestions,
  onClearFrequent,
  onDismissSuggestion,
  onRestoreDismissed,
}) => {
  const [previewQty, setPreviewQty] = useState(4);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    'both' | 'history' | 'suggestions' | 'frequent' | null
  >(null);
  const [showFrequentList, setShowFrequentList] = useState(false);
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);

  // Auto-reset confirmation after 4 seconds
  useEffect(() => {
    if (!confirmAction) return;
    const timer = setTimeout(() => {
      setConfirmAction(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [confirmAction]);

  if (!isOpen) return null;

  const isDark = settings.theme === 'dark';

  const handleTestAudio = () => {
    sound.playClick(settings.clickTone);
  };

  const handlePreviewIncrement = () => {
    sound.playTallyUp();
    setPreviewQty((q) => q + 1);
  };

  const handlePreviewDecrement = () => {
    sound.playTallyDown();
    setPreviewQty((q) => Math.max(1, q - 1));
  };

  // Helper classes for tally size in preview
  const getStepperButtonClass = (size: TallySize) => {
    switch (size) {
      case 'compact':
        return 'w-7 h-7 text-xs';
      case 'medium':
        return 'w-8 h-8 text-sm';
      case 'large':
        return 'w-10 h-10 text-base';
      case 'xlarge':
        return 'w-12 h-12 text-lg';
    }
  };

  const getChevronSize = (size: TallySize) => {
    switch (size) {
      case 'compact':
        return 'w-3.5 h-3.5';
      case 'medium':
        return 'w-4.5 h-4.5';
      case 'large':
        return 'w-6 h-6 stroke-[2.8]';
      case 'xlarge':
        return 'w-7 h-7 stroke-[3]';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#14151C] border-[#2C2D3A] text-zinc-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDark ? 'border-[#262734] bg-[#181922]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#33C2B6]/15 flex items-center justify-center text-[#33C2B6]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">App Settings</h2>
              <p
                className={`text-[11px] ${
                  isDark ? 'text-zinc-400' : 'text-slate-500'
                }`}
              >
                Customize tally size, typography, theme, audio &amp; offline mode
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200'
            }`}
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1">
          {/* SECTION 1: Tally Function Size */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#33C2B6] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Tally Function Size</span>
              </label>
              <span
                className={`text-[11px] font-medium capitalize px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {settings.tallySize}
              </span>
            </div>

            {/* 4-way size buttons */}
            <div className="grid grid-cols-4 gap-2">
              {(['compact', 'medium', 'large', 'xlarge'] as TallySize[]).map((size) => {
                const isSelected = settings.tallySize === size;
                const labels: Record<TallySize, { name: string; desc: string }> = {
                  compact: { name: 'Compact', desc: 'w-7 h-7' },
                  medium: { name: 'Medium', desc: 'w-8 h-8' },
                  large: { name: 'Large', desc: 'w-10 h-10' },
                  xlarge: { name: 'X-Large', desc: 'w-12 h-12' },
                };

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onUpdateSettings({ tallySize: size });
                    }}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#33C2B6] bg-[#33C2B6]/15 text-[#33C2B6] shadow-sm font-semibold ring-1 ring-[#33C2B6]'
                        : isDark
                        ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold">{labels[size].name}</span>
                    <span
                      className={`text-[10px] mt-0.5 ${
                        isSelected ? 'text-[#33C2B6]/90' : isDark ? 'text-zinc-500' : 'text-slate-400'
                      }`}
                    >
                      {labels[size].desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Interactive Live Tally Preview */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-[#181922] border-zinc-800/80' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-[#33C2B6]" />
                  <span>Interactive Preview</span>
                </div>
                <p
                  className={`text-[11px] mt-0.5 truncate ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}
                >
                  Adjust stepper buttons &amp; quantity font
                </p>
              </div>

              {/* Tally stepper preview */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePreviewDecrement}
                  aria-label="Decrement preview"
                  className={`${getStepperButtonClass(
                    settings.tallySize
                  )} rounded-lg border font-bold flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                    isDark
                      ? 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200'
                      : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800 shadow-2xs'
                  }`}
                >
                  <ChevronDown className={getChevronSize(settings.tallySize)} />
                </button>

                <div
                  className={`px-2 py-1 min-w-[38px] text-center font-bold font-mono rounded-lg border ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-teal-400'
                      : 'bg-teal-50 border-teal-200 text-teal-700'
                  }`}
                >
                  {previewQty}
                </div>

                <button
                  type="button"
                  onClick={handlePreviewIncrement}
                  aria-label="Increment preview"
                  className={`${getStepperButtonClass(
                    settings.tallySize
                  )} rounded-lg border font-bold flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                    isDark
                      ? 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200'
                      : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800 shadow-2xs'
                  }`}
                >
                  <ChevronUp className={getChevronSize(settings.tallySize)} />
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 2: Font & Typography */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#33C2B6] flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                <span>Typography &amp; Font Size</span>
              </label>
            </div>

            {/* Font Family selector */}
            <div className="space-y-1.5">
              <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Font Family
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'sans', name: 'Sans', sample: 'Plus Jakarta' },
                  { id: 'rounded', name: 'Rounded', sample: 'Quicksand' },
                  { id: 'mono', name: 'Mono', sample: 'JetBrains' },
                  { id: 'serif', name: 'Serif', sample: 'Editorial' },
                ].map((f) => {
                  const isSelected = settings.fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onUpdateSettings({ fontFamily: f.id as FontFamily });
                      }}
                      className={`py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#33C2B6] bg-[#33C2B6]/15 text-[#33C2B6] shadow-sm font-semibold ring-1 ring-[#33C2B6]'
                          : isDark
                          ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{f.name}</div>
                      <div
                        className={`text-[10px] mt-0.5 truncate ${
                          isSelected ? 'text-[#33C2B6]/90' : isDark ? 'text-zinc-500' : 'text-slate-400'
                        }`}
                      >
                        {f.sample}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size Scale selector */}
            <div className="space-y-1.5">
              <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Scale Adjustment
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'small', label: 'Compact (90%)' },
                  { id: 'medium', label: 'Default (100%)' },
                  { id: 'large', label: 'Comfortable (110%)' },
                ].map((s) => {
                  const isSelected = settings.fontSize === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onUpdateSettings({ fontSize: s.id as FontSize });
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#33C2B6] bg-[#33C2B6]/15 text-[#33C2B6] ring-1 ring-[#33C2B6]'
                          : isDark
                          ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION 3: Appearance / Theme */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#33C2B6] flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5" />
                <span>Color Theme</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Light Mode Card */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onUpdateSettings({ theme: 'light' });
                }}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  settings.theme === 'light'
                    ? 'border-[#33C2B6] bg-[#33C2B6]/15 text-[#33C2B6] ring-1 ring-[#33C2B6]'
                    : isDark
                    ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">Light Mode</div>
                  <div className="text-[11px] opacity-75">Clean daylight contrast</div>
                </div>
                {settings.theme === 'light' && (
                  <Check className="w-4 h-4 ml-auto text-[#33C2B6]" />
                )}
              </button>

              {/* Dark Mode Card */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onUpdateSettings({ theme: 'dark' });
                }}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'border-[#33C2B6] bg-[#33C2B6]/15 text-[#33C2B6] ring-1 ring-[#33C2B6]'
                    : isDark
                    ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-900/40 text-indigo-400 flex items-center justify-center shrink-0">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">Dark Mode</div>
                  <div className="text-[11px] opacity-75">OLED midnight aesthetic</div>
                </div>
                {settings.theme === 'dark' && (
                  <Check className="w-4 h-4 ml-auto text-[#33C2B6]" />
                )}
              </button>
            </div>
          </section>

          {/* SECTION 4: Audio Click Feedback */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#33C2B6] flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Audio Click Feedback</span>
              </label>

              {/* Audio Toggle */}
              <button
                type="button"
                onClick={() => {
                  const next = !settings.audioFeedback;
                  onUpdateSettings({ audioFeedback: next });
                  sound.setEnabled(next);
                  if (next) sound.playClick();
                }}
                aria-label={settings.audioFeedback ? 'Disable audio feedback' : 'Enable audio feedback'}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  settings.audioFeedback ? 'bg-[#33C2B6]' : isDark ? 'bg-zinc-800' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    settings.audioFeedback ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.audioFeedback && (
              <div
                className={`p-3 rounded-xl border space-y-3 animate-in fade-in duration-150 ${
                  isDark ? 'bg-[#181922] border-zinc-800/80' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {/* Tone style selection */}
                <div className="space-y-1.5">
                  <span
                    className={`text-[11px] font-medium ${
                      isDark ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  >
                    Click Sound Style
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'classic' as ClickTone, label: 'Classic' },
                      { id: 'mechanical' as ClickTone, label: 'Switch' },
                      { id: 'pop' as ClickTone, label: 'Bubble' },
                      { id: 'blip' as ClickTone, label: 'Tech' },
                    ].map((t) => {
                      const isSelected = settings.clickTone === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onUpdateSettings({ clickTone: t.id });
                            sound.setTone(t.id);
                            sound.playClick(t.id);
                          }}
                          className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer text-xs ${
                            isSelected
                              ? 'border-[#33C2B6] bg-[#33C2B6]/15 text-[#33C2B6] font-bold ring-1 ring-[#33C2B6]'
                              : isDark
                              ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Volume slider & Test button */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Volume</span>
                      <span className="font-mono text-[#33C2B6]">
                        {Math.round(settings.audioVolume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={settings.audioVolume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateSettings({ audioVolume: val });
                        sound.setVolume(val);
                      }}
                      className="w-full accent-[#33C2B6] cursor-pointer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleTestAudio}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-95 cursor-pointer self-end ${
                      isDark
                        ? 'border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300'
                        : 'border-[#33C2B6]/40 bg-[#33C2B6]/10 hover:bg-[#33C2B6]/20 text-[#33C2B6]'
                    }`}
                    title="Play a test click"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test Click</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 5: History & Suggestions */}
          <section className="space-y-3 pt-1 border-t border-dashed border-zinc-700/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#33C2B6] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>History &amp; Suggestions</span>
              </label>

              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {sessionsCount} sessions &bull; {suggestionsCount} saved
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border space-y-3.5 ${
                isDark ? 'bg-[#181922] border-zinc-800/80' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* Autocomplete Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold">Autocomplete Suggestions</div>
                  <div
                    className={`text-[11px] ${
                      isDark ? 'text-zinc-400' : 'text-slate-500'
                    }`}
                  >
                    Suggest past items as you type in Add Item
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !(settings.enableSuggestions ?? true);
                    onUpdateSettings({ enableSuggestions: next });
                    sound.playClick();
                  }}
                  aria-label={
                    (settings.enableSuggestions ?? true)
                      ? 'Disable suggestions'
                      : 'Enable suggestions'
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    (settings.enableSuggestions ?? true)
                      ? 'bg-[#33C2B6]'
                      : isDark
                      ? 'bg-zinc-800'
                      : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      (settings.enableSuggestions ?? true) ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Frequently Used Suggestions Management */}
              <div
                className={`p-3 rounded-xl border space-y-2.5 ${
                  isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Frequently Used Suggestions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        frequentCount > 0
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : isDark
                          ? 'bg-zinc-800 text-zinc-500'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {frequentCount} {frequentCount === 1 ? 'item' : 'items'}
                    </span>
                    {frequentCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setShowFrequentList((prev) => !prev);
                        }}
                        className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                          isDark
                            ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                        aria-label={showFrequentList ? 'Hide frequent list' : 'View frequent list'}
                      >
                        {showFrequentList ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <p
                  className={`text-[11px] leading-relaxed ${
                    isDark ? 'text-zinc-400' : 'text-slate-500'
                  }`}
                >
                  Items you add or tally frequently are boosted to the top of suggestions. You can clear them all or remove specific items below.
                </p>

                {/* Clear Frequently Used Button */}
                {frequentCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmAction === 'frequent') {
                        onClearFrequent?.();
                        sound.playTallyDown();
                        setConfirmAction(null);
                        setClearedNotice('Cleared frequently used suggestions.');
                        setTimeout(() => setClearedNotice(null), 3500);
                      } else {
                        sound.playClick();
                        setConfirmAction('frequent');
                      }
                    }}
                    className={`w-full py-2 px-3 rounded-lg border text-xs font-semibold transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5 ${
                      confirmAction === 'frequent'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500 animate-pulse'
                        : isDark
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {confirmAction === 'frequent'
                        ? 'Confirm: Clear Frequently Used'
                        : `Clear Frequently Used (${frequentCount})`}
                    </span>
                  </button>
                )}

                {/* Expandable Frequent Items List */}
                {showFrequentList && frequentEntries.length > 0 && (
                  <div
                    className={`pt-2 border-t space-y-1.5 max-h-48 overflow-y-auto pr-1 ${
                      isDark ? 'border-zinc-800' : 'border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-1">
                      Tap ✕ to remove entry from suggestions:
                    </div>
                    {frequentEntries.map((item, idx) => (
                      <div
                        key={`${item.name}-${idx}`}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isDark ? 'bg-zinc-800/60 text-zinc-200' : 'bg-white text-slate-800 border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium truncate">{item.name}</span>
                          {item.category && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                                isDark
                                  ? 'bg-zinc-700 text-zinc-400'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {item.category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isDark
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.frequency || 1}×
                          </span>
                          {onDismissSuggestion && (
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                onDismissSuggestion(item.name);
                              }}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                isDark
                                  ? 'text-zinc-500 hover:text-rose-400 hover:bg-rose-500/15'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                              title={`Remove "${item.name}" from suggestions`}
                              aria-label={`Remove "${item.name}" from suggestions`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {frequentCount === 0 && (
                  <p
                    className={`text-[11px] italic ${
                      isDark ? 'text-zinc-500' : 'text-slate-400'
                    }`}
                  >
                    No frequently used suggestions yet. Items you add to your lists repeatedly will be tracked here.
                  </p>
                )}

                {/* Dismissed suggestions recovery */}
                {dismissedCount > 0 && onRestoreDismissed && (
                  <div
                    className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                      isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>{dismissedCount} suggestion {dismissedCount === 1 ? 'entry' : 'entries'} hidden</span>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onRestoreDismissed();
                        setClearedNotice('Restored hidden suggestion entries.');
                        setTimeout(() => setClearedNotice(null), 3000);
                      }}
                      className="text-teal-400 hover:underline font-semibold cursor-pointer"
                    >
                      Restore All
                    </button>
                  </div>
                )}
              </div>

              {/* Success notification if just cleared */}
              {clearedNotice && (
                <div className="p-2 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span className="font-medium">{clearedNotice}</span>
                </div>
              )}

              {/* Clear Data Section */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  Clear Data &amp; History
                </div>

                {/* Primary Action: Clear History & Suggestions */}
                <button
                  type="button"
                  onClick={() => {
                    if (confirmAction === 'both') {
                      onClearHistoryAndSuggestions?.();
                      sound.playTallyDown();
                      setConfirmAction(null);
                      setClearedNotice('Cleared all history & suggestions.');
                      setTimeout(() => setClearedNotice(null), 3500);
                    } else {
                      sound.playClick();
                      setConfirmAction('both');
                    }
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                    confirmAction === 'both'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500 animate-pulse'
                      : isDark
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                  }`}
                >
                  {confirmAction === 'both' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Tap again to confirm clearing both</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 shrink-0" />
                      <span>Clear History &amp; Suggestions</span>
                    </>
                  )}
                </button>

                {/* Secondary Individual Actions in 3 Columns */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {/* Clear History Only */}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmAction === 'history') {
                        onClearHistory?.();
                        sound.playTallyDown();
                        setConfirmAction(null);
                        setClearedNotice('Cleared picking session history.');
                        setTimeout(() => setClearedNotice(null), 3500);
                      } else {
                        sound.playClick();
                        setConfirmAction('history');
                      }
                    }}
                    disabled={sessionsCount === 0}
                    className={`py-2 px-1.5 rounded-lg border text-[11px] font-semibold transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed ${
                      confirmAction === 'history'
                        ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                        : isDark
                        ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <History className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {confirmAction === 'history' ? 'Confirm' : 'Clear History'}
                    </span>
                  </button>

                  {/* Clear Suggestions Only */}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmAction === 'suggestions') {
                        onClearSuggestions?.();
                        sound.playTallyDown();
                        setConfirmAction(null);
                        setClearedNotice('Cleared saved autocomplete entries.');
                        setTimeout(() => setClearedNotice(null), 3500);
                      } else {
                        sound.playClick();
                        setConfirmAction('suggestions');
                      }
                    }}
                    disabled={suggestionsCount === 0}
                    className={`py-2 px-1.5 rounded-lg border text-[11px] font-semibold transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed ${
                      confirmAction === 'suggestions'
                        ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                        : isDark
                        ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {confirmAction === 'suggestions' ? 'Confirm' : 'Clear Saved'}
                    </span>
                  </button>

                  {/* Clear Frequent Only */}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmAction === 'frequent') {
                        onClearFrequent?.();
                        sound.playTallyDown();
                        setConfirmAction(null);
                        setClearedNotice('Cleared frequently used entries.');
                        setTimeout(() => setClearedNotice(null), 3500);
                      } else {
                        sound.playClick();
                        setConfirmAction('frequent');
                      }
                    }}
                    disabled={frequentCount === 0}
                    className={`py-2 px-1.5 rounded-lg border text-[11px] font-semibold transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed ${
                      confirmAction === 'frequent'
                        ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                        : isDark
                        ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {confirmAction === 'frequent' ? 'Confirm' : 'Clear Frequent'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 6: 100% Offline & App Installation */}
          <section className="space-y-3 pt-1 border-t border-dashed border-zinc-700/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#33C2B6] flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                <span>100% Offline Ready</span>
              </label>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Active &amp; Cached
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border space-y-3 ${
                isDark ? 'bg-[#181922] border-zinc-800/80' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-teal-400">
                    Zero-network dependency guarantee
                  </p>
                  <p
                    className={`leading-relaxed ${
                      isDark ? 'text-zinc-400' : 'text-slate-600'
                    }`}
                  >
                    All items, tallies, presets, and audio clicks are computed &amp; saved locally in your browser storage. You can disconnect Wi-Fi or turn on Airplane mode right now and the app will continue to work flawlessly.
                  </p>
                </div>
              </div>

              {/* Install PWA Button / Actions */}
              {isInstallable && onInstall && (
                <button
                  type="button"
                  onClick={async () => {
                    sound.playClick();
                    await onInstall();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-[#33C2B6] text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Picked to Home Screen / Desktop</span>
                </button>
              )}

              {/* iOS Safari Guide Button */}
              {isIOS && !isInstalled && (
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(true)}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isDark
                      ? 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200'
                      : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-[#33C2B6]" />
                  <span>How to Install on iPhone / iPad</span>
                </button>
              )}

              {/* Already Installed indicator */}
              {isInstalled && (
                <div
                  className={`p-2 rounded-lg border flex items-center gap-2 text-xs ${
                    isDark
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Running as installed standalone application</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-t ${
            isDark ? 'border-[#262734] bg-[#181922]' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onResetSettings();
            }}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-[#33C2B6] hover:bg-[#2EB0A5] text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* iOS Installation Modal Guide */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl space-y-4 ${
              isDark ? 'bg-[#181922] border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 border-zinc-700/50">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#33C2B6]" />
                <h3 className="font-bold text-sm">Install on iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-zinc-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="text-xs space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#33C2B6]/20 text-[#33C2B6] font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span>
                  Tap the <strong>Share button</strong> (square with arrow up) in the Safari bottom bar.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#33C2B6]/20 text-[#33C2B6] font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#33C2B6]/20 text-[#33C2B6] font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span>
                  Tap <strong>Add</strong> in the top right. Picked is now installed as a full standalone app!
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2 rounded-xl bg-[#33C2B6] text-white font-bold text-xs shadow-sm hover:brightness-105 transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
