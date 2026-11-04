import { Sparkles, ChevronDown, Check, Power } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import {
  SCROLL_3D_OPTIONS,
  getAnimationDisplayName,
  type Active3DAnimation,
  type Scroll3DMode,
} from './scroll3dConfig';

interface Scroll3DControlBarProps {
  selectedMode: Scroll3DMode;
  activeAnimation: Active3DAnimation;
  onSelectMode: (mode: Scroll3DMode) => void;
  isEnabled?: boolean;
  onToggleEnabled?: (enabled: boolean) => void;
}

export const Scroll3DControlBar: React.FC<Scroll3DControlBarProps> = React.memo(
  ({
    selectedMode,
    activeAnimation,
    onSelectMode,
    isEnabled = true,
    onToggleEnabled,
  }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const activeDisplayName = getAnimationDisplayName(activeAnimation);
    const liveStatusText =
      selectedMode === 'auto' ? `Auto: ${activeDisplayName}` : `Active: ${activeDisplayName}`;

    useEffect(() => {
      if (!menuOpen || typeof document === 'undefined') return undefined;

      const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
        if (
          containerRef.current &&
          e.target instanceof Node &&
          !containerRef.current.contains(e.target)
        ) {
          setMenuOpen(false);
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMenuOpen(false);
        }
      };

      document.addEventListener('mousedown', handlePointerDownOutside);
      document.addEventListener('touchstart', handlePointerDownOutside, { passive: true });
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousedown', handlePointerDownOutside);
        document.removeEventListener('touchstart', handlePointerDownOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [menuOpen]);

    const handleOptionClick = (mode: Scroll3DMode) => {
      onSelectMode(mode);
      if (!isEnabled && onToggleEnabled) {
        onToggleEnabled(true);
      }
      setMenuOpen(false);
    };

    const handleToggleOnOff = () => {
      if (onToggleEnabled) {
        onToggleEnabled(!isEnabled);
      }
    };

    return (
      <div
        ref={containerRef}
        id="pdf-tools-3d-animation-bar"
        role="region"
        aria-label="3D Scroll Animation Controls"
        className="relative z-30 mt-0 mb-2 flex justify-start"
      >
        <div className="relative inline-block text-left">
          {/* Small, Compact Trigger Button directly beneath 🔧 PDF Tools */}
          <button
            type="button"
            id="scroll-3d-menu-trigger"
            aria-expanded={menuOpen}
            aria-controls="scroll-3d-dropdown-menu"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/35 dark:border-emerald-500/40 bg-white/95 dark:bg-slate-900/90 text-[11px] leading-tight font-bold text-slate-800 dark:text-slate-100 shadow-2xs hover:border-emerald-500/60 transition-colors cursor-pointer"
          >
            <Sparkles
              className={`w-3 h-3 shrink-0 ${
                isEnabled
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
              aria-hidden="true"
            />
            <span className="whitespace-nowrap">3D Motion</span>
            <span
              className={`px-1 py-0.5 rounded text-[9px] leading-none font-mono font-extrabold uppercase tracking-wider ${
                isEnabled
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {isEnabled ? 'ON' : 'OFF'}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-150 ${
                menuOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {/* Compact Dropdown Menu containing ON/OFF Switch + Auto + 5 3D Motions */}
          <div
            id="scroll-3d-dropdown-menu"
            role="group"
            aria-label="Select 3D Scroll Animation Mode"
            className={`${
              menuOpen ? 'block' : 'hidden'
            } absolute left-0 mt-1.5 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl p-1.5 z-50 space-y-0.5`}
          >
            {/* Animation ON / OFF Toggle inside the button */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#f4faf7] dark:bg-slate-800/80 border border-emerald-500/20 dark:border-slate-700/80 mb-1">
              <div className="flex items-center gap-1.5">
                <Power
                  className={`w-3 h-3 shrink-0 ${
                    isEnabled
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                  3D Animation
                </span>
              </div>
              <button
                type="button"
                id="scroll-3d-toggle-enabled"
                role="switch"
                aria-checked={isEnabled}
                aria-label="Toggle 3D Animation On or Off"
                onClick={handleToggleOnOff}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors cursor-pointer border ${
                  isEnabled
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                }`}
              >
                <span>{isEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* 6 Mode Options (🔄 Auto + 5 3D Motions) */}
            {SCROLL_3D_OPTIONS.map((option) => {
              const isSelected = selectedMode === option.id;
              const isCurrentlyRunningInAuto =
                isEnabled && selectedMode === 'auto' && option.id === activeAnimation;

              return (
                <button
                  key={option.id}
                  type="button"
                  id={`scroll-3d-btn-${option.id}`}
                  aria-pressed={isSelected}
                  onClick={() => handleOptionClick(option.id)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-left transition-colors cursor-pointer border ${
                    isSelected && isEnabled
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : isCurrentlyRunningInAuto
                        ? 'bg-emerald-500/12 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/35'
                        : 'bg-transparent text-slate-700 dark:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && isEnabled && (
                    <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Hidden Live Status Badge (Auto: ... / Active: ...) */}
          <div id="scroll-3d-live-status" hidden aria-hidden="true" className="hidden">
            <span>{liveStatusText}</span>
          </div>
        </div>
      </div>
    );
  }
);

Scroll3DControlBar.displayName = 'Scroll3DControlBar';
