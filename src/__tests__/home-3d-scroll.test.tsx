import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Footer } from '../components/Footer';
import { useHero3D, HERO_3D_STORAGE_KEY, detectPerformanceMode } from '../hooks/useHero3D';
import { HeroSection } from '../pages/home/HeroSection';
import {
  AUTO_SCROLL_STEP_PX,
  computeCard3DTransform,
  resolveAuto3DAnimation,
} from '../pages/home/scroll3dConfig';
import { Scroll3DControlBar } from '../pages/home/Scroll3DControlBar';
import { ToolCard } from '../pages/home/ToolCard';

describe('Homepage 3D Background, Scroll3DControlBar & 3D ToolCard Animations', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(navigator, 'deviceMemory', {
      writable: true,
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  it('cycles Auto mode through all 5 3D motions (Flip Cascade -> Helix Spiral -> Deep Zoom -> Orbit Wave -> Prism Fold) every 380px of scroll', () => {
    expect(AUTO_SCROLL_STEP_PX).toBeGreaterThanOrEqual(350);
    expect(AUTO_SCROLL_STEP_PX).toBeLessThanOrEqual(420);

    const step0 = resolveAuto3DAnimation(0);
    expect(step0.current).toBe('flip-cascade');
    expect(step0.next).toBe('helix-spiral');

    const step1 = resolveAuto3DAnimation(AUTO_SCROLL_STEP_PX + 20);
    expect(step1.current).toBe('helix-spiral');
    expect(step1.next).toBe('deep-zoom');

    const step2 = resolveAuto3DAnimation(AUTO_SCROLL_STEP_PX * 2 + 20);
    expect(step2.current).toBe('deep-zoom');
    expect(step2.next).toBe('orbit-wave');

    const step3 = resolveAuto3DAnimation(AUTO_SCROLL_STEP_PX * 3 + 20);
    expect(step3.current).toBe('orbit-wave');
    expect(step3.next).toBe('prism-fold');

    const step4 = resolveAuto3DAnimation(AUTO_SCROLL_STEP_PX * 4 + 20);
    expect(step4.current).toBe('prism-fold');
    expect(step4.next).toBe('flip-cascade');

    const step5 = resolveAuto3DAnimation(AUTO_SCROLL_STEP_PX * 5 + 20);
    expect(step5.current).toBe('flip-cascade');
  });

  it('computes distinct 3D transforms for Flip Cascade, Helix Spiral, Deep Zoom, Orbit Wave, and Prism Fold', () => {
    const leftHelix = computeCard3DTransform('helix-spiral', {
      normDist: 0.75,
      colIndex: 0,
      totalCols: 4,
      rowIndex: 1,
      cardIndex: 4,
      scrollY: 420,
      scrollVelocity: 0.2,
    });
    const rightHelix = computeCard3DTransform('helix-spiral', {
      normDist: 0.75,
      colIndex: 3,
      totalCols: 4,
      rowIndex: 1,
      cardIndex: 7,
      scrollY: 420,
      scrollVelocity: 0.2,
    });

    // Left and right cards rotate in opposite directions in 3D Helix Spiral
    expect(Math.sign(leftHelix.ry)).toBe(-1);
    expect(Math.sign(rightHelix.ry)).toBe(1);
    expect(Math.sign(leftHelix.rz)).toBe(1);
    expect(Math.sign(rightHelix.rz)).toBe(-1);

    // Center card gets strong emerald spotlight glow and positive Z levitation
    const centerZoom = computeCard3DTransform('deep-zoom', {
      normDist: 0,
      colIndex: 1,
      totalCols: 4,
      rowIndex: 0,
      cardIndex: 1,
      scrollY: 800,
      scrollVelocity: 0,
    });
    expect(centerZoom.spotlightOpacity).toBeGreaterThan(0.85);
    expect(centerZoom.tz).toBeGreaterThan(25);

    // 4. Orbit Wave and 5. Prism Fold produce distinct alternating column rotations
    const prismEvenCol = computeCard3DTransform('prism-fold', {
      normDist: 0.6,
      colIndex: 0,
      totalCols: 4,
      rowIndex: 0,
      cardIndex: 0,
      scrollY: 300,
      scrollVelocity: 0,
    });
    const prismOddCol = computeCard3DTransform('prism-fold', {
      normDist: 0.6,
      colIndex: 1,
      totalCols: 4,
      rowIndex: 0,
      cardIndex: 1,
      scrollY: 300,
      scrollVelocity: 0,
    });
    expect(Math.sign(prismEvenCol.ry)).toBe(-1);
    expect(Math.sign(prismOddCol.ry)).toBe(1);
  });

  it('renders compact 3D Motion trigger button under PDF Tools with dropdown menu (ON/OFF toggle, Auto, and 5 3D motions)', () => {
    const onSelect = vi.fn();
    const onToggleEnabled = vi.fn();
    render(
      <Scroll3DControlBar
        selectedMode="auto"
        activeAnimation="flip-cascade"
        onSelectMode={onSelect}
        isEnabled={true}
        onToggleEnabled={onToggleEnabled}
      />
    );

    const triggerBtn = document.getElementById('scroll-3d-menu-trigger') as HTMLButtonElement;
    const dropdownMenu = document.getElementById('scroll-3d-dropdown-menu');
    expect(triggerBtn).not.toBeNull();
    expect(dropdownMenu?.classList.contains('hidden')).toBe(true);

    // Click the compact button to open the menu
    fireEvent.click(triggerBtn);
    expect(dropdownMenu?.classList.contains('block')).toBe(true);

    const toggleSwitch = screen.getByRole('switch', { name: /Toggle 3D Animation On or Off/i });
    expect(toggleSwitch).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(toggleSwitch);
    expect(onToggleEnabled).toHaveBeenCalledWith(false);

    const autoBtn = screen.getByRole('button', { name: /🔄 Auto/i });
    const flipBtn = screen.getByRole('button', { name: /1\. 3D Flip Cascade/i });
    const helixBtn = screen.getByRole('button', { name: /2\. 3D Helix Spiral/i });
    const zoomBtn = screen.getByRole('button', { name: /3\. 3D Deep Zoom/i });
    const orbitBtn = screen.getByRole('button', { name: /4\. 3D Orbit Wave/i });
    const prismBtn = screen.getByRole('button', { name: /5\. 3D Prism Fold/i });

    expect(autoBtn).toHaveAttribute('aria-pressed', 'true');
    expect(flipBtn).toHaveAttribute('aria-pressed', 'false');
    expect(helixBtn).toHaveAttribute('aria-pressed', 'false');
    expect(zoomBtn).toHaveAttribute('aria-pressed', 'false');
    expect(orbitBtn).toHaveAttribute('aria-pressed', 'false');
    expect(prismBtn).toHaveAttribute('aria-pressed', 'false');

    const statusEl = document.getElementById('scroll-3d-live-status');
    expect(statusEl).not.toBeNull();
    expect(statusEl?.hasAttribute('hidden')).toBe(true);

    fireEvent.click(orbitBtn);
    expect(onSelect).toHaveBeenCalledWith('orbit-wave');
  });

  it('preserves ToolCard 3D depth layers (34px icon, 28px badge, 22px title, 26px CTA, -32px shadow) and link routing', () => {
    render(
      <MemoryRouter>
        <ToolCard
          tool={{
            slug: 'merge-pdf',
            name: 'Merge PDF',
            description: 'Combine multiple PDFs locally in your browser.',
          }}
          variant="featured"
          cardIndex={0}
        />
      </MemoryRouter>
    );

    const cardLink = document.getElementById('tool-card-merge');
    expect(cardLink).not.toBeNull();
    expect(cardLink?.classList.contains('pdf-tool-card-3d')).toBe(true);
    expect(cardLink?.className).toContain('hover:scale-[1.02]');
    expect(cardLink?.querySelector('.pdf-card-depth-shadow')).not.toBeNull();
    expect(cardLink?.querySelector('.pdf-card-holographic-shimmer')).not.toBeNull();
    expect(cardLink?.querySelector('.pdf-card-spotlight-glow')).not.toBeNull();
    expect(cardLink?.querySelector('[data-layer-depth="34px"]')).not.toBeNull();
    expect(cardLink?.querySelector('[data-layer-depth="28px"]')).not.toBeNull();
    expect(cardLink?.querySelector('[data-layer-depth="22px"]')).not.toBeNull();
    expect(cardLink?.querySelector('[data-layer-depth="26px"]')).not.toBeNull();
  });

  it('uses requestAnimationFrame for ToolCard mouse-tracking rotation and applies 1.02x hover scale', () => {
    let queuedCallback: FrameRequestCallback | null = null;
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      queuedCallback = cb;
      return 101;
    });
    const cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <ToolCard
          tool={{
            slug: 'merge-pdf',
            name: 'Merge PDF',
            description: 'Combine multiple PDFs locally in your browser.',
          }}
          variant="featured"
          cardIndex={0}
        />
      </MemoryRouter>
    );

    const cardLink = document.getElementById('tool-card-merge') as HTMLAnchorElement;
    vi.spyOn(cardLink, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 200,
      height: 100,
      right: 200,
      bottom: 100,
      toJSON: () => ({}),
    });

    fireEvent.pointerMove(cardLink, { clientX: 150, clientY: 25 });
    expect(rafSpy).toHaveBeenCalledTimes(1);
    expect(queuedCallback).not.toBeNull();

    // Execute the queued animation frame
    act(() => {
      queuedCallback?.(16.67);
    });

    expect(cardLink.style.getPropertyValue('--hover-rx')).toBe('2.50deg');
    expect(cardLink.style.getPropertyValue('--hover-ry')).toBe('3.00deg');
    expect(cardLink.style.getPropertyValue('--hover-tz')).toBe('18px');
    expect(cardLink.style.getPropertyValue('--hover-scale')).toBe('1.02');

    fireEvent.pointerLeave(cardLink);
    expect(cardLink.style.getPropertyValue('--hover-rx')).toBe('0deg');
    expect(cardLink.style.getPropertyValue('--hover-ry')).toBe('0deg');
    expect(cardLink.style.getPropertyValue('--hover-tz')).toBe('0px');
    expect(cardLink.style.getPropertyValue('--hover-scale')).toBe('1');

    rafSpy.mockRestore();
    cancelRafSpy.mockRestore();
  });

  it('enables performance mode and disables 3D transformation on devices with low memory or limited touch capabilities', () => {
    Object.defineProperty(navigator, 'deviceMemory', {
      writable: true,
      configurable: true,
      value: 2,
    });

    expect(detectPerformanceMode()).toBe(true);

    render(
      <MemoryRouter>
        <ToolCard
          tool={{
            slug: 'merge-pdf',
            name: 'Merge PDF',
            description: 'Combine multiple PDFs locally in your browser.',
          }}
          variant="featured"
          cardIndex={0}
        />
      </MemoryRouter>
    );

    const cardLink = document.getElementById('tool-card-merge') as HTMLAnchorElement;
    expect(cardLink.getAttribute('data-performance-mode')).toBe('true');
    expect(cardLink.getAttribute('data-3d-disabled')).toBe('true');
    expect(cardLink.getAttribute('data-card-3d')).toBe('false');

    fireEvent.pointerMove(cardLink, { clientX: 120, clientY: 40 });
    expect(cardLink.style.getPropertyValue('--hover-rx')).toBe('');
    expect(cardLink.style.getPropertyValue('--hover-ry')).toBe('');
  });

  it('allows users to toggle 3D mode on/off from the site Footer switch', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(hover: hover) and (pointer: fine)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const footerSwitch = document.getElementById('footer-toggle-3d-mode') as HTMLButtonElement;
    expect(footerSwitch).not.toBeNull();
    expect(footerSwitch).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(footerSwitch);
    expect(footerSwitch).toHaveAttribute('aria-checked', 'false');
    expect(window.localStorage.getItem(HERO_3D_STORAGE_KEY)).toBe('false');

    fireEvent.click(footerSwitch);
    expect(footerSwitch).toHaveAttribute('aria-checked', 'true');
    expect(window.localStorage.getItem(HERO_3D_STORAGE_KEY)).toBe('true');
  });

  it('useHero3D defaults OFF on mobile/tablet and does not request 3D chunk until manual toggle', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useHero3D());
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.enabled).toBe(false);
    expect(result.current.shouldRender3D).toBe(false);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.enabled).toBe(true);
    expect(result.current.shouldRender3D).toBe(true);
    expect(window.localStorage.getItem(HERO_3D_STORAGE_KEY)).toBe('true');
  });

  it('HeroSection keeps the legacy Enable 3D / Disable 3D toggle button hidden', () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <HeroSection enabled3D={false} onToggle3D={onToggle} supported3D={true} />
    );

    const btn = document.getElementById('hero-3d-toggle-btn') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.hasAttribute('hidden')).toBe(true);
    expect(btn.className).toContain('hidden');

    rerender(
      <HeroSection
        enabled3D={false}
        onToggle3D={onToggle}
        supported3D={true}
        autoDisabledNotice={true}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('3D turned off to keep things fast');
  });
});

