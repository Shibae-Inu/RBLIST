import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, AlertTriangle } from 'lucide-react';
import { TodoItem } from '../types';
import { sound } from '../utils/audio';

interface ItemModalProps {
  item: TodoItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: TodoItem) => void;
  onDelete: (id: string) => void;
  availableCategories: string[];
  existingNames?: string[];
}

export const ItemModal: React.FC<ItemModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
  onDelete,
  availableCategories,
  existingNames = [],
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [category, setCategory] = useState(item.category || '');
  const [notes, setNotes] = useState(item.notes || '');
  const [unit, setUnit] = useState(item.unit || '');
  const [picked, setPicked] = useState(item.picked);

  const trimmedName = name.trim();
  const isDuplicate =
    trimmedName.toLowerCase() !== item.name.trim().toLowerCase() &&
    existingNames.some((n) => n.trim().toLowerCase() === trimmedName.toLowerCase());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmedName || isDuplicate) {
      sound.playTallyDown();
      return;
    }

    sound.playClick();
    onSave({
      ...item,
      name: trimmedName,
      quantity: Math.max(1, quantity),
      category: category.trim() || undefined,
      notes: notes.trim() || undefined,
      unit: unit.trim() || undefined,
      picked,
      updatedAt: Date.now(),
    });
    onClose();
  };

  const commonUnits = ['units', 'cans', 'boxes', 'packs', 'lbs', 'bottles', 'cases'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-[#1B1C23] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#15161C]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#35C2B6]/20 text-[#35C2B6] flex items-center justify-center text-xs font-bold">
              i
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Item Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Item Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Item Name
              </label>
              {isDuplicate && (
                <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Duplicate entry not allowed
                </span>
              )}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className={`w-full bg-[#24252F] border rounded-lg px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none text-base transition-colors ${
                isDuplicate
                  ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/30'
                  : 'border-zinc-700 focus:border-[#35C2B6]'
              }`}
              placeholder="e.g. Apple 12"
            />
            {isDuplicate && (
              <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                An item named &ldquo;{trimmedName}&rdquo; already exists in your list.
              </p>
            )}
          </div>

          {/* Quantity Tally Stepper */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              Target Quantity / Tally
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  sound.playTallyDown();
                  setQuantity((prev) => Math.max(1, prev - 1));
                }}
                disabled={quantity <= 1}
                className="w-11 h-11 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-200 flex items-center justify-center active:scale-95 transition-all text-lg font-bold cursor-pointer"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="flex-1 flex items-center justify-center bg-[#24252F] border border-zinc-700 rounded-lg h-11">
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-transparent text-center text-xl font-bold text-teal-400 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playTallyUp();
                  setQuantity((prev) => prev + 1);
                }}
                className="w-11 h-11 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#35C2B6] flex items-center justify-center active:scale-95 transition-all text-lg font-bold cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Quick increment chips */}
              <div className="flex gap-1">
                {[5, 10, 20].map((add) => (
                  <button
                    key={add}
                    type="button"
                    onClick={() => {
                      sound.playTallyUp();
                      setQuantity((prev) => prev + add);
                    }}
                    className="px-2 py-1 h-11 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 cursor-pointer"
                  >
                    +{add}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Unit / packaging */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              Unit (Optional)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {commonUnits.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(unit === u ? '' : u)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    unit === u
                      ? 'bg-[#35C2B6] border-[#35C2B6] text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Custom unit (e.g. cans, bottles, trays)"
              className="w-full bg-[#24252F] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#35C2B6]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              Category
            </label>
            {availableCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {availableCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(category === c ? '' : c)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      category === c
                        ? 'bg-[#35C2B6] border-[#35C2B6] text-white'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Drinks 8oz, Produce, Snacks"
              className="w-full bg-[#24252F] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#35C2B6]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              Notes / Location
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Aisle number, bin location, packaging notes..."
              className="w-full bg-[#24252F] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#35C2B6] resize-none"
            />
          </div>

          {/* Picked Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#24252F] border border-zinc-800">
            <div>
              <p className="text-sm font-medium text-zinc-200">Picked Status</p>
              <p className="text-xs text-zinc-400">
                {picked ? 'Marked as completed / picked' : 'Waiting in Current List'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playCheck();
                setPicked(!picked);
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                picked ? 'bg-[#35C2B6]' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  picked ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Row: Delete Item */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => {
                sound.playTallyDown();
                onDelete(item.id);
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 py-1.5 px-3 rounded hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Item</span>
            </button>
          </div>

          {/* Footer Save / Cancel */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDuplicate || !trimmedName}
              className={`px-5 py-2 font-medium text-sm rounded-lg shadow-sm transition-all cursor-pointer ${
                isDuplicate || !trimmedName
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                  : 'bg-[#35C2B6] hover:bg-[#2EB3A8] text-white active:scale-95'
              }`}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
