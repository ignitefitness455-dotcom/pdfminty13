import fs from 'node:fs';
import path from 'node:path';

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { CompressAnimation } from '../components/CompressAnimation';
import { ConsentManager } from '../components/ConsentManager';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { PDFSanitizer } from '../core/PDFSanitizer';
import { setupErrorTelemetry } from '../error-handler';
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

  it('CompressAnimation uses an honest indeterminate progressbar and invokes onCancel without fabricated savings', () => {
    const onCancel = vi.fn();
    const { container, unmount } = renderWithRoot(
      <CompressAnimation
        fileName="report.pdf"
        originalSizeBytes={1048576}
        compressionMode="recommended"
        onCancel={onCancel}
      />
    );
    const progressbar = container.querySelector('[role="progressbar"]');
    expect(progressbar).not.toBeNull();
    expect(container.textContent).not.toContain('(-70%)');
    expect(container.textContent).not.toContain('Byte Squisher');

    const cancelBtn = container.querySelector('#cancel_compress_btn') as HTMLButtonElement;
    expect(cancelBtn).not.toBeNull();
    act(() => {
      cancelBtn.click();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('PDFSanitizer.ts, core/index.ts, and PdfToImgPage.tsx avoid eager main-thread PDF engine imports', () => {
    const sanitizerSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/core/PDFSanitizer.ts'),
      'utf8'
    );
    const coreIndexSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/core/index.ts'), 'utf8');
    const pdfToImgSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/PdfToImgPage.tsx'),
      'utf8'
    );

    expect(sanitizerSrc).not.toMatch(/^import\s+.*from\s+['"]@cantoo\/pdf-lib['"]/m);
    expect(sanitizerSrc).toContain("await import('@cantoo/pdf-lib')");
    expect(coreIndexSrc).not.toMatch(/^import\s+.*from\s+['"]\.\/PDFSanitizer['"]/m);
    expect(pdfToImgSrc).not.toContain('getPdfJs');
  });

  it('PDFSanitizer.sanitize uses copy-on-write (zero-copy for clean PDFs, cloned when neutralizing scripts)', () => {
    const cleanBytes = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\n%%EOF');
    const cleanResult = PDFSanitizer.sanitize(cleanBytes);
    expect(cleanResult.bytes).toBe(cleanBytes);
    expect(cleanResult.warnings).toHaveLength(0);

    const scriptBytes = new TextEncoder().encode(
      '%PDF-1.7\n1 0 obj\n<< /S /JavaScript /JS (app.alert(1)) >>\n%%EOF'
    );
    const scriptResult = PDFSanitizer.sanitize(scriptBytes);
    expect(scriptResult.bytes).not.toBe(scriptBytes);
    expect(new TextDecoder().decode(scriptResult.bytes)).not.toContain('/JavaScript');
    expect(new TextDecoder().decode(scriptBytes)).toContain('/JavaScript');
  });

  it('setupErrorTelemetry deduplicates global error and unhandledrejection listeners across repeated calls', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const cleanup1 = setupErrorTelemetry();
    const cleanup2 = setupErrorTelemetry();

    expect(removeSpy).toHaveBeenCalledWith('error', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

    cleanup1();
    cleanup2();
    addSpy.mockRestore();
    void removeSpy.mockRestore();
  });

  it('prevents click-to-navigation lag by disabling v7_startTransition, avoiding synchronous 818KB seo-data imports in ToolContentSection/CompressPdfPage, and keeping ToolCard click handlers non-blocking', () => {
    const mainSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/main.tsx'), 'utf8');
    const toolContentSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/components/ToolContentSection.tsx'),
      'utf8'
    );
    const compressSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/CompressPdfPage.tsx'),
      'utf8'
    );
    const toolCardSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/home/ToolCard.tsx'),
      'utf8'
    );

    expect(mainSrc).toContain('v7_startTransition: false');
    expect(toolContentSrc).not.toMatch(/^import\s+\{\s*TOOLS\b.*\}\s+from\s+['"]\.\.\/config\/seo-data['"]/m);
    expect(toolContentSrc).toContain("import('../config/seo-data')");
    expect(compressSrc).not.toContain('ToolLongForm');
    expect(toolCardSrc).not.toContain('window.scrollTo');
    expect(toolCardSrc).not.toContain('useLocation');
  });
});


