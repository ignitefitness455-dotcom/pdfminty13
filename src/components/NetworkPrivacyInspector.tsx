import React from 'react';

/**
 * Lightweight local memory processing tracker.
 * Kept for internal operations telemetry without DOM clutter or network interception.
 */
export function recordLocalProcessing(_bytesCount: number, _label: string) {
  // Silent in-memory tracker (no DOM, no network monkey-patching)
}

/**
 * Visual badge and live monitor UI disabled per clean UI guidelines.
 */
export const NetworkPrivacyInspector: React.FC = () => {
  return null;
};

export default NetworkPrivacyInspector;
