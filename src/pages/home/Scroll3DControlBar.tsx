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
        className="relative z-30 mt-0 mb-3 flex justify-start"
      >
        <div className="relative inline-block text-left">
          {/* Sleek, Attractive 3D Motion Trigger Button directly beneath 🔧 PDF Tools */}
          <button
            type="button"
            id="scroll-3d-menu-trigger"
            aria-expanded={menuOpen}
            aria-controls="scroll-3d-dropdown-menu"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`group inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border backdrop-blur-md text-xs leading-tight font-bold transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
              isEnabled
                ? 'border-emerald-500/45 dark:border-emerald-400/40 bg-gradient-to-r from-white/95 via-emerald-50/70 to-teal-50/60 dark:from-slate-900/95 dark:via-emerald-950/60 dark:to-teal-950/50 text-slate-900 dark:text-white shadow-[0_4px_20px_-4px_rgba(16,185,129,0.32)] hover:shadow-[0_8px_25px_-4px_rgba(16,185,129,0.48)] hover:border-emerald-500/75 hover:-translate-y-0.5 active:translate-y-0'
                : 'border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/85 text-slate-600 dark:text-slate-300 shadow-xs hover:border-emerald-500/40 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {/* Glowing 3D Icon Badge */}
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-lg transition-transform duration-200 group-hover:scale-105 ${
                isEnabled
                  ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-[0_2px_10px_rgba(16,185,129,0.45)]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
              }`}
              aria-hidden="true"
            >
              <Sparkles
                className={`w-3.5 h-3.5 shrink-0 ${
                  isEnabled ? 'text-white animate-pulse' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
            </span>

            {/* Label */}
            <span className="whitespace-nowrap tracking-tight font-extrabold bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-900 dark:from-white dark:via-emerald-100 dark:to-teal-200 bg-clip-text text-transparent">
              3D Motion
            </span>

            {/* Live Status Pill with Pulsing Dot */}
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] leading-none font-mono font-extrabold uppercase tracking-wider border transition-colors ${
                isEnabled
                  ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/70 dark:border-slate-700'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isEnabled ? 'bg-emerald-500 animate-ping' : 'bg-slate-400 dark:bg-slate-500'
                }`}
                aria-hidden="true"
              />
              <span>{isEnabled ? 'ON' : 'OFF'}</span>
            </span>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 transition-transform duration-200 ${
                menuOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {/* Elevated Glass Dropdown Menu containing ON/OFF Switch + Auto + 5 3D Motions */}
          <div
            id="scroll-3d-dropdown-menu"
            role="group"
            aria-label="Select 3D Scroll Animation Mode"
            className={`${
              menuOpen ? 'block' : 'hidden'
            } absolute left-0 mt-2 w-64 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-emerald-500/25 dark:border-emerald-500/30 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.22)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65)] p-2 z-50 space-y-1`}
          >
            {/* Animation ON / OFF Toggle Header */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50/90 to-teal-50/60 dark:from-slate-800/90 dark:to-emerald-950/40 border border-emerald-500/20 dark:border-slate-700/80 mb-1.5">
              <div className="flex items-center gap-2">
                <Power
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isEnabled
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
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
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition-all duration-150 cursor-pointer border ${
                  isEnabled
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-xs'
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
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold text-left transition-all duration-150 cursor-pointer border ${
                    isSelected && isEnabled
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500/80 shadow-xs'
                      : isCurrentlyRunningInAuto
                        ? 'bg-emerald-500/12 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/35'
                        : 'bg-transparent text-slate-700 dark:text-slate-200 border-transparent hover:bg-emerald-50/70 dark:hover:bg-slate-800/80 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && isEnabled && (
                    <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
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
