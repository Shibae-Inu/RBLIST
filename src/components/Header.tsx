import React from 'react';
import { History, Settings, Download } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  isEditing: boolean;
  onToggleEdit: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  isInstallable?: boolean;
  onInstall?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isEditing,
  onToggleEdit,
  onOpenHistory,
  onOpenSettings,
  isInstallable,
  onInstall,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#031C44] text-white shadow-lg border-b-2 border-[#DA0C25] select-none pt-[env(safe-area-inset-top)]">
      {/* Red Bull Top Bar */}
      <div className="flex items-center justify-between px-2.5 sm:px-4 md:px-6 py-1.5 sm:py-2">
        {/* Left: History Button */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenHistory();
          }}
          className="flex items-center gap-1 sm:gap-1.5 text-[12px] sm:text-[14px] font-semibold text-zinc-200 hover:text-[#FFC700] transition-colors active:scale-95 cursor-pointer px-1.5 py-1 rounded-md shrink-0"
        >
          <History className="w-4 h-4 stroke-[2.2] text-[#FFC700]" />
          <span>History</span>
        </button>

        {/* Center: Enlarged Red Bull Logo with no border, perfectly fitting the top bar */}
        <div className="flex items-center justify-center flex-1 min-w-0 px-1.5 sm:px-2 py-0.5">
          <img
            src="/src/assets/images/redbull_header_logo.png"
            alt="Red Bull"
            className="h-10 sm:h-12 w-auto max-w-[130px] min-[360px]:max-w-[165px] sm:max-w-[210px] md:max-w-[250px] object-contain select-none"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Right: Install, Settings & Done/Edit Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Quick Install Button when browser supports install prompt */}
          {isInstallable && onInstall && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onInstall();
              }}
              title="Install for offline access"
              className="flex items-center gap-1 text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-md transition-all active:scale-95 cursor-pointer shadow-2xs border border-white/10"
            >
              <Download className="w-3.5 h-3.5 text-[#FFC700]" />
              <span className="hidden sm:inline">Install</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            title="Open Settings"
            aria-label="Settings"
            className="p-1.5 rounded-lg text-zinc-300 hover:text-[#FFC700] hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
          >
            <Settings className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
          </button>

          {/* Edit / Done Button */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onToggleEdit();
            }}
            className={`text-[13px] sm:text-[14px] font-bold px-2 py-1 rounded-md transition-all active:scale-95 cursor-pointer ${
              isEditing
                ? 'bg-[#DA0C25] text-white hover:bg-[#B70A20] shadow-sm'
                : 'text-zinc-200 hover:text-[#FFC700] hover:bg-white/10'
            }`}
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>
    </header>
  );
};
