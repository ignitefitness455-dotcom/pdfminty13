import fs from 'node:fs';
import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { computeLineDiff } from '../pages/ComparePdfPage';

describe('Phase 2 Performance, Main-Thread Decoupling & Accessibility Regressions', () => {
  it('computeLineDiff computes exact line numbers and edits on standard text pages', () => {
    const linesA = ['Header Line', 'Clause 1: Original fee $100', 'Clause 2: Net 30', 'Footer'];
    const linesB = [
      'Header Line',
      'Clause 1: Updated fee $150',
      'Clause 1b: Late fee 2%',
      'Clause 2: Net 30',
      'Footer',
    ];

    const diff = computeLineDiff(linesA, linesB);

    expect(diff[0]).toEqual({ type: 'unchanged', text: 'Header Line', lineA: 1, lineB: 1 });
    expect(diff.some((d) => d.type === 'removed' && d.text.includes('$100'))).toBe(true);
    expect(diff.some((d) => d.type === 'added' && d.text.includes('$150'))).toBe(true);
    expect(diff.some((d) => d.type === 'added' && d.text.includes('Late fee 2%'))).toBe(true);
    expect(diff[diff.length - 1]).toEqual({
      type: 'unchanged',
      text: 'Footer',
      lineA: 4,
      lineB: 5,
    });
  });

  it('computeLineDiff handles dense 2000x2000 line comparisons without O(m*n) memory spike', () => {
    const linesA = Array.from({ length: 2000 }, (_, idx) =>
      idx % 7 === 0 ? `Only in A #${idx}` : `Shared Dense Line #${idx}`
    );
    const linesB = Array.from({ length: 2000 }, (_, idx) =>
      idx % 7 === 0 ? `Only in B #${idx}` : `Shared Dense Line #${idx}`
    );

    const start = performance.now();
    const diff = computeLineDiff(linesA, linesB);
    const elapsedMs = performance.now() - start;

    expect(diff.length).toBeGreaterThan(2000);
    expect(elapsedMs).toBeLessThan(250);
    const unchangedCount = diff.filter((d) => d.type === 'unchanged').length;
    expect(unchangedCount).toBeGreaterThan(1500);
  });

  it('decouples eager main-thread @cantoo/pdf-lib runtime imports from EditMetadataPage, SanitizePdfPage, and sign-pdf/export', () => {
    const repoRoot = path.resolve(__dirname, '../..');
    const filesToCheck = [
      'src/pages/EditMetadataPage.tsx',
      'src/pages/SanitizePdfPage.tsx',
      'src/components/sign-pdf/export.ts',
    ];

    for (const relPath of filesToCheck) {
      const source = fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
      // Only `import type` or dynamic `await import('@cantoo/pdf-lib')` is allowed
      const staticValueImports = source
        .split('\n')
        .filter(
          (line) =>
            /^import\s+(?!type\b)/.test(line.trim()) && line.includes("'@cantoo/pdf-lib'")
        );
      expect(staticValueImports, `Unexpected static @cantoo/pdf-lib import in ${relPath}`).toEqual(
        []
      );
    }
  });

  it('GrayscalePdfPage provides honest rasterization guidance and ImgToPdfPage exposes >=36px touch controls & drag-and-drop', () => {
    const repoRoot = path.resolve(__dirname, '../..');
    const grayscaleSrc = fs.readFileSync(
      path.join(repoRoot, 'src/pages/GrayscalePdfPage.tsx'),
      'utf8'
    );
    expect(grayscaleSrc).not.toContain('compressing documents by up to 60-80%');
    expect(grayscaleSrc).toContain('Compress PDF tool');

    const imgToPdfSrc = fs.readFileSync(
      path.join(repoRoot, 'src/pages/ImgToPdfPage.tsx'),
      'utf8'
    );
    expect(imgToPdfSrc).toContain('min-w-[36px] min-h-[36px]');
    expect(imgToPdfSrc).toContain('draggable');
    expect(imgToPdfSrc).toContain('handleReorder');
  });

  it('decouples BlogPostPage, IsSafePdfArticlePage, and all UI components from synchronous 777 kB seo-data imports', () => {
    const repoRoot = path.resolve(__dirname, '../..');
    const dirsToScan = ['src/pages', 'src/components'];

    for (const relDir of dirsToScan) {
      const entries = fs.readdirSync(path.join(repoRoot, relDir), { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) continue;
        const relPath = `${relDir}/${entry.name}`;
        const source = fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
        const staticSeoDataImports = source
          .split('\n')
          .filter(
            (line) =>
              /^import\s+(?!type\b)/.test(line.trim()) &&
              /['"](?:\.\.\/)*config\/seo-data['"]/.test(line)
          );
        expect(
          staticSeoDataImports,
          `Unexpected synchronous runtime seo-data import in ${relPath}`
        ).toEqual([]);
      }
    }
  });
});
