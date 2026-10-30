import fs from 'fs';
import path from 'path';

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ConsentManager } from '../components/ConsentManager';

describe('Consent Mode v2 integrity & Firestore security rules verification (TASK-P1-04, SEC-06)', () => {
  beforeEach(() => {
    localStorage.removeItem('pdfminty_consent_v2');
  });

  afterEach(() => {
    localStorage.removeItem('pdfminty_consent_v2');
  });

  it('index.html has no spoofed __tcfapi / CMP ID 134 / dummy Cookiebot stub and defaults Consent Mode v2 to denied', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).not.toContain('window.__tcfapi');
    expect(html).not.toContain('cmpId: 134');
    expect(html).not.toContain('CP_v2_PDFMINTY_CONSENT');
    expect(html).not.toContain('00000000-0000-0000-0000-000000000000');
    expect(html).toContain("gtag('consent', 'default'");
    expect(html).toContain("'analytics_storage': stored && stored.analytics_storage === 'granted' ? 'granted' : 'denied'");
    expect(html).toContain("'ad_storage': stored && stored.ad_storage === 'granted' ? 'granted' : 'denied'");
  });

  it('ConsentManager defaults analytics_storage and ad_* toggles to unchecked (strictly opt-in)', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <MemoryRouter>
          <ConsentManager />
        </MemoryRouter>
      );
    });

    act(() => {
      window.dispatchEvent(new CustomEvent('open-cmp-preferences'));
    });

    const analyticsCheckbox = container.querySelector(
      'input[aria-label="Analytics storage consent"]'
    ) as HTMLInputElement | null;
    const adStorageCheckbox = container.querySelector(
      'input[aria-label="Advertising storage consent"]'
    ) as HTMLInputElement | null;

    expect(analyticsCheckbox).not.toBeNull();
    expect(analyticsCheckbox?.checked).toBe(false);
    expect(adStorageCheckbox?.checked).toBe(false);
    expect(container.textContent).not.toContain('CMP ID 134');

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('firestore.rules enforces strict key whitelists on users, usage, and feedback and blocks client Pro escalation', () => {
    const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
    expect(rules).toContain('request.resource.data.keys().hasOnly([');
    expect(rules).toContain('request.resource.data.diff(resource.data).affectedKeys().hasOnly([');
    expect(rules).toContain("request.resource.data.aiAnalysesUsed >= resource.data.get('aiAnalysesUsed', 0)");
    // Ensure client create/update whitelists never permit `isPro` or `plan`
    const createBlock = rules.split('allow create: if isOwner(userId)')[1]?.split('allow update:')[0] || '';
    expect(createBlock).not.toContain("'isPro'");
    expect(createBlock).not.toContain("'plan'");
  });
});
