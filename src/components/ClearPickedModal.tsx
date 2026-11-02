import React from 'react';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { sound } from '../utils/audio';

interface ClearPickedModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickedCount: number;
  totalUnits: number;
  onDeletePicked: () => void;
  onUnpickAll: () => void;
}

export const ClearPickedModal: React.FC<ClearPickedModalProps> = ({
  isOpen,
  onClose,
  pickedCount,
  totalUnits,
  onDeletePicked,
  onUnpickAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm bg-[#1C1D25] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#16171E]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-zinc-100">Clear Picked Items</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-zinc-300 leading-relaxed">
            You currently have <strong className="text-teal-300">{pickedCount} items</strong> ({totalUnits} total {totalUnits === 1 ? 'can' : 'cans'} &bull; ~{Math.round(totalUnits / 24)} {Math.round(totalUnits / 24) === 1 ? 'case' : 'cases'}) in the <span className="text-[#FBBF24] font-semibold">Picked</span> category. What would you like to do?
          </p>

          <div className="space-y-2.5 pt-1">
            {/* Option 1: Permanently delete picked items */}
            <button
              type="button"
              onClick={() => {
                sound.playTallyDown();
                onDeletePicked();
                onClose();
              }}
              className="w-full p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center gap-3 transition-colors group text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500/30 transition-colors">
                <Trash2 className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-rose-200">Delete Picked Items</div>
                <div className="text-[11px] text-zinc-400">Permanently removes them from this list</div>
              </div>
            </button>

            {/* Option 2: Move back to Current List (Unpick) */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onUnpickAll();
                onClose();
              }}
              className="w-full p-3 rounded-xl bg-[#242631] hover:bg-[#2C2E3C] border border-zinc-700/60 text-zinc-200 flex items-center gap-3 transition-colors group text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 text-teal-400 group-hover:bg-zinc-700 transition-colors">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-zinc-100">Move Back to Current List</div>
                <div className="text-[11px] text-zinc-400">Uncheck all items to run this pick again</div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-[#16171E] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
