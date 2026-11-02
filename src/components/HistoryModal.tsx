import React, { useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  Calendar,
  RotateCcw,
  Trash2,
  Download,
  Share2,
  Copy,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { PickSession, TodoItem } from '../types';
import { sound } from '../utils/audio';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: PickSession[];
  onRestoreSession: (items: TodoItem[]) => void;
  onClearHistory: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onRestoreSession,
  onClearHistory,
  onDeleteSession,
}) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    sessions[0]?.id || null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAllTimeUnits = sessions.reduce(
    (sum, s) => sum + s.totalQuantity,
    0
  );
  const totalAllTimeItems = sessions.reduce(
    (sum, s) => sum + s.totalPickedItems,
    0
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const handleCopySummary = (session: PickSession) => {
    const text = [
      `📋 Pick Session Report - ${session.date}`,
      `Duration: ${formatDuration(session.durationSeconds)}`,
      `Total Items: ${session.totalPickedItems} (${session.totalQuantity} total cans • ~${Math.round(session.totalQuantity / 24)} cases)`,
      '--------------------------------',
      ...session.items.map(
        (it) => `• ${it.name} - Qty: ${it.quantity} ${it.unit || ''} ${it.picked ? '✓' : ''}`
      ),
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedId(session.id);
    sound.playClick();
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#1B1C23] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#15161C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#35C2B6]/20 text-[#35C2B6] flex items-center justify-center">
              <Clock className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Pick History &amp; Logs</h2>
              <p className="text-xs text-zinc-400">Past completed pick runs &amp; tallies</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Summary Stats */}
        {sessions.length > 0 && (
          <div className="px-5 py-3 bg-[#13141A] border-b border-zinc-800/80 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-zinc-800/50">
              <span className="text-zinc-400 block text-[11px]">Completed Runs</span>
              <span className="text-lg font-bold text-teal-300">{sessions.length}</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-800/50">
              <span className="text-zinc-400 block text-[11px]">Total Units Tallied</span>
              <span className="text-lg font-bold text-amber-300">{totalAllTimeUnits}</span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-800/50">
              <span className="text-zinc-400 block text-[11px]">Items Picked</span>
              <span className="text-lg font-bold text-zinc-200">{totalAllTimeItems}</span>
            </div>
          </div>
        )}

        {/* Content / Session List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {sessions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-3 stroke-[1.2]" />
              <h3 className="text-zinc-300 font-semibold text-base mb-1">No Past Runs Recorded</h3>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                When you finish a picking session by checking off items and tapping &ldquo;Finish &amp; Log Run&rdquo;, your completion statistics and item tallies will appear here.
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const isExpanded = expandedSessionId === session.id;
              return (
                <div
                  key={session.id}
                  className="bg-[#22242D] border border-zinc-700/60 rounded-xl overflow-hidden transition-all"
                >
                  {/* Session Header Item */}
                  <div
                    onClick={() =>
                      setExpandedSessionId(isExpanded ? null : session.id)
                    }
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-zinc-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-teal-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-100">
                            {session.title || 'Completed Pick Session'}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-medium">
                            {session.totalPickedItems} items
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                          <span>{session.date}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(session.durationSeconds)}
                          </span>
                          <span>•</span>
                          <span className="text-amber-300/90 font-medium">
                            {session.totalQuantity} total cans &bull; ~{Math.round(session.totalQuantity / 24)} {Math.round(session.totalQuantity / 24) === 1 ? 'case' : 'cases'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleCopySummary(session)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-700 text-xs flex items-center gap-1 transition-colors"
                        title="Copy summary report"
                      >
                        {copiedId === session.id ? (
                          <span className="text-teal-400 font-semibold text-[11px]">Copied!</span>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          sound.playClick();
                          onRestoreSession(session.items);
                          onClose();
                        }}
                        className="p-1.5 text-teal-400 hover:text-teal-300 rounded-md hover:bg-zinc-700 text-xs flex items-center gap-1 transition-colors font-medium"
                        title="Reload list to work on again"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Load</span>
                      </button>
                      <button
                        onClick={() => {
                          sound.playTallyDown();
                          onDeleteSession(session.id);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-md hover:bg-rose-950/30 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Item Breakdown */}
                  {isExpanded && (
                    <div className="px-4 py-3 bg-[#1A1B22] border-t border-zinc-800 text-xs">
                      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Picked Items Breakdown
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {session.items.map((it) => (
                          <div
                            key={it.id}
                            className="flex items-center justify-between p-2 rounded bg-zinc-800/70 border border-zinc-700/40 text-zinc-200"
                          >
                            <span className="font-medium truncate mr-2">
                              {it.name}
                            </span>
                            <span className="text-teal-300 font-mono font-semibold whitespace-nowrap">
                              Qty: {it.quantity} {it.unit || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {sessions.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-800 bg-[#15161C] flex items-center justify-between">
            <button
              onClick={() => {
                if (window.confirm('Clear all historical pick sessions?')) {
                  onClearHistory();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
