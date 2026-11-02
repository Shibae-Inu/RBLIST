import React, { useState } from 'react';
import { X, Sparkles, Check, BookmarkPlus, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { PresetList, TodoItem } from '../types';
import { PRESET_LISTS } from '../data/presets';
import { sound } from '../utils/audio';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPreset: (items: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt' | 'picked'>[]) => void;
  onSaveCurrentAsPreset: (name: string, description: string) => void;
  customPresets: PresetList[];
  onDeleteCustomPreset: (id: string) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onLoadPreset,
  onSaveCurrentAsPreset,
  customPresets,
  onDeleteCustomPreset,
}) => {
  const [activeTab, setActiveTab] = useState<'built-in' | 'custom' | 'save'>('built-in');
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    sound.playClick();
    onSaveCurrentAsPreset(newPresetName.trim(), newPresetDesc.trim() || 'Custom saved tally list');
    setNewPresetName('');
    setNewPresetDesc('');
    setActiveTab('custom');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[#1B1C23] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#15161C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Templates &amp; Presets</h2>
              <p className="text-xs text-zinc-400">Load sample inventory lists or save your own</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-800 bg-[#16171E] px-4 pt-2">
          <button
            onClick={() => setActiveTab('built-in')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'built-in'
                ? 'border-[#35C2B6] text-[#35C2B6]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Curated Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-[#35C2B6] text-[#35C2B6]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>My Templates</span>
            {customPresets.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-zinc-800 text-[10px] flex items-center justify-center text-teal-300">
                {customPresets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('save')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'save'
                ? 'border-[#35C2B6] text-[#35C2B6]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Current List</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'built-in' && (
            <div className="space-y-3">
              {PRESET_LISTS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 rounded-xl bg-[#22242D] border border-zinc-700/60 hover:border-teal-500/50 transition-all flex items-center justify-between group"
                >
                  <div className="pr-3">
                    <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      {preset.name}
                      {preset.id === 'preset-beverages' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-normal">
                          Screenshot Replica
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{preset.description}</p>
                    <span className="text-[11px] text-zinc-500 mt-1 inline-block">
                      {preset.items.length} items &bull;{' '}
                      {preset.items.reduce((acc, it) => acc + it.quantity, 0)} total units
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onLoadPreset(preset.items);
                      onClose();
                    }}
                    className="flex-shrink-0 px-3.5 py-1.5 bg-[#35C2B6] hover:bg-[#2EB3A8] text-white text-xs font-semibold rounded-lg shadow-sm active:scale-95 transition-all"
                  >
                    Load List
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-3">
              {customPresets.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <BookmarkPlus className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-300 text-sm font-medium">No custom templates saved yet</p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Save your current list of tallies and to-dos to reuse anytime.
                  </p>
                  <button
                    onClick={() => setActiveTab('save')}
                    className="mt-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-teal-300 text-xs font-medium rounded-lg"
                  >
                    Save Current List Now
                  </button>
                </div>
              ) : (
                customPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 rounded-xl bg-[#22242D] border border-zinc-700/60 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">{preset.name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{preset.description}</p>
                      <span className="text-[11px] text-zinc-500 mt-1 inline-block">
                        {preset.items.length} items &bull;{' '}
                        {preset.items.reduce((acc, it) => acc + it.quantity, 0)} total units
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.playClick();
                          onLoadPreset(preset.items);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-[#35C2B6] hover:bg-[#2EB3A8] text-white text-xs font-semibold rounded-lg active:scale-95 transition-all"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => onDeleteCustomPreset(preset.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-md hover:bg-rose-950/30 transition-colors"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'save' && (
            <form onSubmit={handleSave} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. Monday Restock, Cooler Refill"
                  required
                  className="w-full bg-[#24252F] border border-zinc-700 rounded-lg px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#35C2B6] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  placeholder="e.g. Standard bar items and packaging"
                  className="w-full bg-[#24252F] border border-zinc-700 rounded-lg px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#35C2B6] text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('built-in')}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPresetName.trim()}
                  className="px-4 py-2 bg-[#35C2B6] hover:bg-[#2EB3A8] text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-40"
                >
                  Save Current List
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
