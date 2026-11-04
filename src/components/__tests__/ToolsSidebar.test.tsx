import { render, screen, fireEvent } from '@testing-library/react';
import { FileText, Scissors } from 'lucide-react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import { ToolsSidebar, type ToolSidebarItem } from '../ToolsSidebar';

const sampleItems: ToolSidebarItem[] = [
  {
    slug: 'merge-pdf',
    name: 'Merge PDF',
    path: '/merge-pdf/',
    icon: FileText,
  },
  {
    slug: 'split-pdf',
    name: 'Split PDF',
    path: '/split-pdf/',
    icon: Scissors,
  },
];

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
};

describe('ToolsSidebar Left Navigation Menu', () => {
  it('renders only tool names in the left sidebar and highlights active tool', () => {
    render(
      <MemoryRouter initialEntries={['/merge-pdf/']}>
        <ToolsSidebar items={sampleItems} activeToolSlug="merge-pdf" />
      </MemoryRouter>
    );

    const mergeLink = document.getElementById('sidebar-tool-merge-pdf');
    const splitLink = document.getElementById('sidebar-tool-split-pdf');

    expect(mergeLink).not.toBeNull();
    expect(splitLink).not.toBeNull();
    expect(mergeLink?.textContent).toBe('Merge PDF');
    expect(splitLink?.textContent).toBe('Split PDF');
    expect(mergeLink?.getAttribute('aria-current')).toBe('page');
    expect(splitLink?.getAttribute('aria-current')).toBeNull();
  });

  it('navigates directly to the selected tool route on click', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <ToolsSidebar items={sampleItems} activeToolSlug={null} />
        <Routes>
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    const splitLink = document.getElementById('sidebar-tool-split-pdf') as HTMLAnchorElement;
    expect(splitLink).not.toBeNull();

    fireEvent.click(splitLink);
    expect(screen.getByTestId('current-path').textContent).toBe('/split-pdf/');
  });

  it('sorts sidebar PDF tools according to global user popularity order even when passed in raw catalog order', async () => {
    const { POPULAR_PDF_TOOLS_ORDER, sortToolsByPopularity } = await import('../ToolsSidebar');
    const { TOOLS_CATALOG } = await import('../../config/seo-catalog');

    const rawCatalogTools = TOOLS_CATALOG.filter((t) => t.type === 'tool');
    expect(rawCatalogTools).toHaveLength(24);

    // Raw catalog starts with edit-pdf-metadata, not merge-pdf
    expect(rawCatalogTools[0].slug).toBe('edit-pdf-metadata');

    const sortedCatalogTools = sortToolsByPopularity(rawCatalogTools);
    expect(sortedCatalogTools.map((t) => t.slug)).toEqual([...POPULAR_PDF_TOOLS_ORDER]);

    // Verify DOM rendering inside ToolsSidebar respects popularity order
    const unsortedSidebarItems: ToolSidebarItem[] = [
      {
        slug: 'edit-pdf-metadata',
        name: 'Edit Metadata',
        path: '/edit-pdf-metadata/',
        icon: FileText,
      },
      { slug: 'sanitize-pdf', name: 'Sanitize PDF', path: '/sanitize-pdf/', icon: FileText },
      { slug: 'compress-pdf', name: 'Compress PDF', path: '/compress-pdf/', icon: FileText },
      { slug: 'merge-pdf', name: 'Merge PDF', path: '/merge-pdf/', icon: FileText },
      { slug: 'sign-pdf', name: 'Sign PDF', path: '/sign-pdf/', icon: FileText },
      { slug: 'split-pdf', name: 'Split PDF', path: '/split-pdf/', icon: Scissors },
    ];

    render(
      <MemoryRouter initialEntries={['/']}>
        <ToolsSidebar items={unsortedSidebarItems} activeToolSlug={null} />
      </MemoryRouter>
    );

    const desktopSidebar = document.getElementById('tools-left-sidebar');
    expect(desktopSidebar).not.toBeNull();
    const renderedSlugs = Array.from(desktopSidebar!.querySelectorAll('a')).map((a) =>
      a.id.replace('sidebar-tool-', '')
    );

    expect(renderedSlugs).toEqual([
      'merge-pdf',
      'compress-pdf',
      'split-pdf',
      'sign-pdf',
      'edit-pdf-metadata',
      'sanitize-pdf',
    ]);
  });
});
