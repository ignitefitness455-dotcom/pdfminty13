import fs from 'node:fs';
import path from 'node:path';

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, afterEach } from 'vitest';

import { ConsentManager } from '../components/ConsentManager';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { FaqSection } from '../pages/home/FaqSection';

function renderWithRoot(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe('Prompt 6 — Performance, Mobile UX & Accessibility Regressions', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('index.html viewport meta allows user pinch-to-zoom (WCAG 1.4.4)', () => {
    const htmlPath = path.resolve(process.cwd(), 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const viewportMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]*>/i);
    expect(viewportMatch).not.toBeNull();
    const tag = viewportMatch?.[0] ?? '';
    expect(tag).not.toMatch(/user-scalable\s*=\s*no/i);
    expect(tag).not.toMatch(/maximum-scale\s*=\s*1(\.0)?\b/i);
  });

  it('App.tsx lazy-loads PrivacyPolicyPage and TermsOfServicePage out of the initial entry bundle', () => {
    const appPath = path.resolve(process.cwd(), 'src/App.tsx');
    const src = fs.readFileSync(appPath, 'utf8');
    expect(src).toContain("import('./pages/PrivacyPolicyPage')");
    expect(src).toContain("import('./pages/TermsOfServicePage')");
    expect(src).not.toMatch(/^import\s+\{\s*PrivacyPolicyPage\s*\}\s+from/m);
    expect(src).not.toMatch(/^import\s+\{\s*TermsOfServicePage\s*\}\s+from/m);
  });

  it('vite.config.ts splits vendor-icons, vendor-i18n, and vendor-firebase before vendor-react', () => {
    const vitePath = path.resolve(process.cwd(), 'vite.config.ts');
    const src = fs.readFileSync(vitePath, 'utf8');
    const iconsIdx = src.indexOf("return 'vendor-icons'");
    const i18nIdx = src.indexOf("return 'vendor-i18n'");
    const firebaseIdx = src.indexOf("return 'vendor-firebase'");
    const reactIdx = src.indexOf("return 'vendor-react'");
    expect(iconsIdx).toBeGreaterThan(0);
    expect(i18nIdx).toBeGreaterThan(0);
    expect(firebaseIdx).toBeGreaterThan(0);
    expect(reactIdx).toBeGreaterThan(0);
    expect(iconsIdx).toBeLessThan(reactIdx);
    expect(i18nIdx).toBeLessThan(reactIdx);
    expect(firebaseIdx).toBeLessThan(reactIdx);
  });

  it('FaqSection accordion buttons expose aria-expanded and aria-controls (WCAG 4.1.2)', () => {
    const { container, unmount } = renderWithRoot(<FaqSection />);
    const buttons = container.querySelectorAll('button[aria-expanded]');
    expect(buttons.length).toBeGreaterThan(0);
    const firstBtn = buttons[0] as HTMLButtonElement;
    expect(firstBtn.getAttribute('aria-expanded')).toBe('false');
    act(() => {
      firstBtn.click();
    });
    expect(firstBtn.getAttribute('aria-expanded')).toBe('true');
    const regionId = firstBtn.getAttribute('aria-controls');
    expect(regionId).toBeTruthy();
    expect(container.querySelector(`#${regionId}[role="region"]`)).not.toBeNull();
    unmount();
  });

  it('ConsentManager preferences dialog uses modal focus trap attributes when opened', () => {
    const { container, unmount } = renderWithRoot(
      <MemoryRouter>
        <ConsentManager />
      </MemoryRouter>
    );
    act(() => {
      window.dispatchEvent(new CustomEvent('open-cmp-preferences'));
    });
    const dialog = container.querySelector('[role="dialog"][aria-modal="true"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute('tabindex')).toBe('-1');
    unmount();
  });

  it('ThemeProvider exposes unified setTheme and toggleTheme across consumers', () => {
    const Probe: React.FC = () => {
      const { isDark, setTheme } = useTheme();
      return (
        <button type="button" onClick={() => setTheme('dark')} data-dark={String(isDark)}>
          Toggle
        </button>
      );
    };
    const { container, unmount } = renderWithRoot(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(btn.getAttribute('data-dark')).toBe('false');
    act(() => {
      btn.click();
    });
    expect(btn.getAttribute('data-dark')).toBe('true');
    unmount();
  });
});
