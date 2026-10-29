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
});
