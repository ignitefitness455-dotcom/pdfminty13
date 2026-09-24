import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import InternalSEO from '../InternalSEO';

describe('InternalSEO Duplication Guard', () => {
  beforeEach(() => {
    // Clear any previous scripts
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove());
  });

  afterEach(() => {
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove());
  });

  it('does not duplicate JSON-LD when static scripts are already present in DOM', async () => {
    // Simulate static HTML pre-rendered with 4 JSON-LD blocks (e.g. /merge-pdf/)
    const staticSchemas = [
      { '@context': 'https://schema.org', '@type': 'WebApplication', name: 'PdfMinty - Merge PDF' },
      { '@context': 'https://schema.org', '@type': 'HowTo', name: 'How to merge' },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [] },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] },
    ];

    staticSchemas.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    expect(document.querySelectorAll('script[type="application/ld+json"]').length).toBe(4);

    // Render InternalSEO for /merge-pdf
    render(
      <MemoryRouter initialEntries={['/merge-pdf']}>
        <InternalSEO />
      </MemoryRouter>
    );

    // Wait for effect to execute
    await waitFor(() => {
      const allScripts = document.querySelectorAll('script[type="application/ld+json"]');
      // Must remain exactly 4 (no duplicate client injection)
      expect(allScripts.length).toBe(4);
    });

    const dynamicScript = document.querySelector('script[data-dynamic-seo="true"]');
    expect(dynamicScript).toBeNull();
  });

  it('injects JSON-LD with data-dynamic-seo when no static scripts exist in DOM', async () => {
    render(
      <MemoryRouter initialEntries={['/merge-pdf']}>
        <InternalSEO />
      </MemoryRouter>
    );

    await waitFor(() => {
      const dynamicScript = document.querySelector('script[data-dynamic-seo="true"]');
      expect(dynamicScript).not.toBeNull();
      const parsed = JSON.parse(dynamicScript?.textContent || '[]');
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      const types = parsed.map((p: Record<string, unknown>) => p['@type']);
      expect(types).toContain('WebApplication');
      expect(types).toContain('BreadcrumbList');
    });
  });

  it('only injects missing schema types if partial static scripts exist', async () => {
    // Only WebApplication is in static HTML
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'PdfMinty - Merge PDF',
    });
    document.head.appendChild(script);

    render(
      <MemoryRouter initialEntries={['/merge-pdf']}>
        <InternalSEO />
      </MemoryRouter>
    );

    await waitFor(() => {
      const dynamicScript = document.querySelector('script[data-dynamic-seo="true"]');
      expect(dynamicScript).not.toBeNull();
      const parsed = JSON.parse(dynamicScript?.textContent || '[]');
      const types = parsed.map((p: Record<string, unknown>) => p['@type']);
      // WebApplication should be excluded because it was already in static HTML
      expect(types).not.toContain('WebApplication');
      // BreadcrumbList, HowTo, FAQPage should be injected
      expect(types).toContain('BreadcrumbList');
      expect(types).toContain('HowTo');
    });
  });
});
