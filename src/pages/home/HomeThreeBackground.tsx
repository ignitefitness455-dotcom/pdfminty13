import React, { useEffect, useRef, useState } from 'react';

import { type Active3DAnimation } from './scroll3dConfig';

export interface HomeThreeBackgroundProps {
  activeAnimation: Active3DAnimation;
  onLowFps?: () => void;
  onReady?: () => void;
}

interface PagePlacement {
  xVw: number;
  yVh: number;
  zPx: number;
  rxDeg: number;
  ryDeg: number;
  rzDeg: number;
  scale: number;
  floatSpeed: number;
  floatOffset: number;
  orbitRadiusPx: number;
}

interface RingPlacement {
  xVw: number;
  yVh: number;
  zPx: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  floatOffset: number;
  isCrystal: boolean;
}

const PAGE_PLACEMENTS: readonly PagePlacement[] = [
  {
    xVw: -36,
    yVh: -22,
    zPx: -80,
    rxDeg: 10,
    ryDeg: 22,
    rzDeg: -7,
    scale: 0.92,
    floatSpeed: 0.65,
    floatOffset: 0,
    orbitRadiusPx: 14,
  },
  {
    xVw: 36,
    yVh: -21,
    zPx: -95,
    rxDeg: -9,
    ryDeg: -24,
    rzDeg: 8,
    scale: 0.92,
    floatSpeed: 0.83,
    floatOffset: 1.15,
    orbitRadiusPx: 18,
  },
  {
    xVw: -32,
    yVh: 18,
    zPx: -65,
    rxDeg: 13,
    ryDeg: 18,
    rzDeg: 5,
    scale: 0.92,
    floatSpeed: 1.01,
    floatOffset: 2.3,
    orbitRadiusPx: 22,
  },
  {
    xVw: 33,
    yVh: 19,
    zPx: -75,
    rxDeg: -11,
    ryDeg: -20,
    rzDeg: -6,
    scale: 0.92,
    floatSpeed: 1.19,
    floatOffset: 3.45,
    orbitRadiusPx: 14,
  },
  {
    xVw: -21,
    yVh: -31,
    zPx: -180,
    rxDeg: 7,
    ryDeg: 14,
    rzDeg: -10,
    scale: 0.76,
    floatSpeed: 0.65,
    floatOffset: 4.6,
    orbitRadiusPx: 18,
  },
  {
    xVw: 22,
    yVh: -29,
    zPx: -190,
    rxDeg: -8,
    ryDeg: -16,
    rzDeg: 9,
    scale: 0.76,
    floatSpeed: 0.83,
    floatOffset: 5.75,
    orbitRadiusPx: 22,
  },
  {
    xVw: -42,
    yVh: -2,
    zPx: -160,
    rxDeg: 5,
    ryDeg: 27,
    rzDeg: -4,
    scale: 0.76,
    floatSpeed: 1.01,
    floatOffset: 6.9,
    orbitRadiusPx: 14,
  },
  {
    xVw: 42,
    yVh: 1,
    zPx: -170,
    rxDeg: -6,
    ryDeg: -26,
    rzDeg: 5,
    scale: 0.76,
    floatSpeed: 1.19,
    floatOffset: 8.05,
    orbitRadiusPx: 18,
  },
  {
    xVw: -19,
    yVh: 31,
    zPx: -175,
    rxDeg: 14,
    ryDeg: 11,
    rzDeg: 9,
    scale: 0.76,
    floatSpeed: 0.65,
    floatOffset: 9.2,
    orbitRadiusPx: 22,
  },
  {
    xVw: 20,
    yVh: 30,
    zPx: -185,
    rxDeg: -13,
    ryDeg: -13,
    rzDeg: -8,
    scale: 0.76,
    floatSpeed: 0.83,
    floatOffset: 10.35,
    orbitRadiusPx: 14,
  },
];

const RING_PLACEMENTS: readonly RingPlacement[] = [
  {
    xVw: -26,
    yVh: -9,
    zPx: -120,
    rotSpeedX: 20,
    rotSpeedY: 28,
    rotSpeedZ: 14,
    floatOffset: 0,
    isCrystal: false,
  },
  {
    xVw: 27,
    yVh: -10,
    zPx: -130,
    rotSpeedX: 24,
    rotSpeedY: 25,
    rotSpeedZ: 22,
    floatOffset: 0.95,
    isCrystal: true,
  },
  {
    xVw: -24,
    yVh: 26,
    zPx: -115,
    rotSpeedX: 27,
    rotSpeedY: 22,
    rotSpeedZ: 14,
    floatOffset: 1.9,
    isCrystal: false,
  },
  {
    xVw: 25,
    yVh: 25,
    zPx: -125,
    rotSpeedX: 31,
    rotSpeedY: 19,
    rotSpeedZ: 22,
    floatOffset: 2.85,
    isCrystal: true,
  },
  {
    xVw: 0,
    yVh: -34,
    zPx: -200,
    rotSpeedX: 34,
    rotSpeedY: 16,
    rotSpeedZ: 14,
    floatOffset: 3.8,
    isCrystal: false,
  },
  {
    xVw: 0,
    yVh: 34,
    zPx: -195,
    rotSpeedX: 38,
    rotSpeedY: 13,
    rotSpeedZ: 22,
    floatOffset: 4.75,
    isCrystal: true,
  },
];

const ORBITAL_NODE_ANGLES: readonly number[] = [0, 45, 90, 135, 180, 225, 270, 315];

const PARTICLE_COORDS: readonly { left: string; top: string; scale: number }[] = Array.from(
  { length: 18 },
  (_, i) => {
    const t = i / 18;
    const angle = i * 2.39996;
    const radius = 14 + t * 34;
    const xPct = 50 + Math.cos(angle) * radius * 1.1;
    const yPct = 50 + Math.sin(angle) * radius * 0.85;
    return {
      left: `${xPct.toFixed(1)}%`,
      top: `${yPct.toFixed(1)}%`,
      scale: Number((0.75 + (i % 4) * 0.2).toFixed(2)),
    };
  }
);

const DOC_LINE_WIDTHS = ['88%', '76%', '84%', '62%', '88%', '80%'] as const;
const MINI_BAR_HEIGHTS = ['35%', '60%', '48%', '74%', '56%', '80%'] as const;

function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-dt * lambda));
}

export const HomeThreeBackground: React.FC<HomeThreeBackgroundProps> = React.memo(
  ({ activeAnimation, onLowFps, onReady }) => {
    const [fadedIn, setFadedIn] = useState(false);

    const laserBarRef = useRef<HTMLDivElement | null>(null);
    const stageCameraRef = useRef<HTMLDivElement | null>(null);
    const scannerGroupRef = useRef<HTMLDivElement | null>(null);
    const outerRingRef = useRef<HTMLDivElement | null>(null);
    const innerRingRef = useRef<HTMLDivElement | null>(null);
    const coreRingRef = useRef<HTMLDivElement | null>(null);
    const coreDiscRef = useRef<HTMLDivElement | null>(null);
    const laserScanLineRef = useRef<HTMLDivElement | null>(null);
    const particleFieldRef = useRef<HTMLDivElement | null>(null);

    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
    const ringRefs = useRef<(HTMLDivElement | null)[]>([]);

    const activeAnimRef = useRef<Active3DAnimation>(activeAnimation);
    const onLowFpsRef = useRef(onLowFps);
    const onReadyRef = useRef(onReady);

    useEffect(() => {
      activeAnimRef.current = activeAnimation;
    }, [activeAnimation]);

    useEffect(() => {
      onLowFpsRef.current = onLowFps;
    }, [onLowFps]);

    useEffect(() => {
      onReadyRef.current = onReady;
    }, [onReady]);

    useEffect(() => {
      onReadyRef.current?.();
      if (typeof window === 'undefined') return undefined;
      const raf = window.requestAnimationFrame(() => {
        setFadedIn(true);
      });
      return () => window.cancelAnimationFrame(raf);
    }, []);

    useEffect(() => {
      if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
      if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')) {
        return undefined;
      }

      let disposed = false;
      let frameId = 0;
      let isRunning = false;
      let isHeroVisible = true;
      let isTabVisible = !document.hidden;

      let lastTime = performance.now();
      let elapsed = 0;

      // FPS safety net counters over the first 2 seconds of active rendering
      let fpsFrames = 0;
      let fpsAccumulatedSec = 0;
      let fpsChecked = false;

      let vw = Math.max(320, window.innerWidth || 1280);
      let vh = Math.max(400, window.innerHeight || 800);
      let maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);

      let targetScrollY = window.scrollY || 0;
      let smoothScrollY = targetScrollY;
      let scrollVelocity = 0;

      let targetMouseX = 0;
      let targetMouseY = 0;
      let smoothMouseX = 0;
      let smoothMouseY = 0;

      let outerRingZDeg = 0;
      let innerRingXDeg = 56;
      let innerRingYDeg = 36;
      let coreRingZDeg = 30;
      const ringAngles = RING_PLACEMENTS.map(() => ({ x: 0, y: 0, z: 0 }));

      const updateProgressBarDirect = (scrollY: number) => {
        const barEl = laserBarRef.current;
        if (!barEl) return;
        const rawProgress = Math.max(0.02, Math.min(1, scrollY / maxScroll));
        barEl.style.setProperty('--laser-progress', rawProgress.toFixed(4));
      };

      const tick = (now: number) => {
        if (disposed || !isRunning) return;

        const rawDt = (now - lastTime) / 1000;
        lastTime = now;

        // Ignore huge frame gaps caused by background tab throttling
        if (rawDt > 0.25) {
          frameId = window.requestAnimationFrame(tick);
          return;
        }

        const dt = Math.min(0.05, Math.max(0.001, rawDt));
        elapsed += dt;

        // Evaluate 2-second FPS safety net (threshold: 24 FPS)
        if (!fpsChecked) {
          fpsFrames += 1;
          fpsAccumulatedSec += dt;
          if (fpsAccumulatedSec >= 2.0) {
            fpsChecked = true;
            const avgFps = fpsFrames / fpsAccumulatedSec;
            if (avgFps < 24) {
              disposed = true;
              isRunning = false;
              onLowFpsRef.current?.();
              return;
            }
          }
        }

        // Smooth mouse & scroll with exponential damping (1 - Math.exp(-dt * 8))
        const prevSmoothScroll = smoothScrollY;
        smoothScrollY = damp(smoothScrollY, targetScrollY, 8, dt);
        const rawVel = (smoothScrollY - prevSmoothScroll) / Math.max(0.008, dt * 600);
        scrollVelocity = damp(scrollVelocity, rawVel, 8, dt);

        smoothMouseX = damp(smoothMouseX, targetMouseX, 8, dt);
        smoothMouseY = damp(smoothMouseY, targetMouseY, 8, dt);

        updateProgressBarDirect(targetScrollY);

        const scrollNorm = smoothScrollY * 0.0018;
        const currentMode = activeAnimRef.current;

        // 1. Stage camera parallax & scroll depth
        const cameraEl = stageCameraRef.current;
        if (cameraEl) {
          const modeCamZ =
            currentMode === 'deep-zoom'
              ? Math.sin(scrollNorm * 1.6) * 42
              : currentMode === 'helix-spiral'
                ? Math.cos(scrollNorm * 1.2) * 26
                : currentMode === 'orbit-wave'
                  ? Math.sin(scrollNorm * 1.3) * 32
                  : 0;
          const camX = smoothMouseX * 28 + Math.sin(scrollNorm * 0.9) * 14;
          const camY = -smoothMouseY * 20 - Math.sin(scrollNorm * 0.65) * 16;
          const camZ = modeCamZ - Math.min(48, Math.abs(scrollVelocity) * 22);
          const camRotX = smoothMouseY * 4.5;
          const camRotY = -smoothMouseX * 5.5;
          const camRotZ =
            currentMode === 'helix-spiral' || currentMode === 'orbit-wave'
              ? Math.sin(scrollNorm * 1.4) * 2.2 - smoothMouseX * 1.1
              : -smoothMouseX * 0.85;

          cameraEl.style.transform = `translate3d(${camX.toFixed(1)}px, ${camY.toFixed(1)}px, ${camZ.toFixed(1)}px) rotateX(${camRotX.toFixed(2)}deg) rotateY(${camRotY.toFixed(2)}deg) rotateZ(${camRotZ.toFixed(2)}deg)`;
        }

        // 2. Centerpiece Dual-Ring 3D Holographic Scanner
        const scannerBoost = 1 + Math.min(2.2, Math.abs(scrollVelocity) * 1.8);
        outerRingZDeg = (outerRingZDeg + dt * 16 * scannerBoost) % 360;
        const outerXDeg =
          (Math.sin(elapsed * 0.55 + scrollNorm) * 0.28 + smoothMouseY * 0.18) * 57.2958;
        const outerYDeg =
          (Math.cos(elapsed * 0.45 + scrollNorm * 1.3) * 0.32 + smoothMouseX * 0.22) * 57.2958;

        if (outerRingRef.current) {
          outerRingRef.current.style.transform = `rotateX(${outerXDeg.toFixed(2)}deg) rotateY(${outerYDeg.toFixed(2)}deg) rotateZ(${outerRingZDeg.toFixed(2)}deg)`;
        }

        innerRingXDeg = (innerRingXDeg + dt * 30 * scannerBoost) % 360;
        innerRingYDeg = (innerRingYDeg - dt * 22 * scannerBoost) % 360;
        if (innerRingRef.current) {
          innerRingRef.current.style.transform = `rotateX(${innerRingXDeg.toFixed(2)}deg) rotateY(${innerRingYDeg.toFixed(2)}deg)`;
        }

        coreRingZDeg = (coreRingZDeg - dt * 37 * scannerBoost) % 360;
        if (coreRingRef.current) {
          coreRingRef.current.style.transform = `rotateX(-45deg) rotateY(15deg) rotateZ(${coreRingZDeg.toFixed(2)}deg)`;
        }

        if (coreDiscRef.current) {
          const discZ = ((elapsed * 23 + scrollNorm * 114) % 360).toFixed(2);
          coreDiscRef.current.style.transform = `rotateZ(${discZ}deg)`;
        }

        if (laserScanLineRef.current) {
          const scanY = Math.sin(elapsed * 2.1 + scrollNorm * 3.5) * 95;
          laserScanLineRef.current.style.transform = `translate3d(0px, ${scanY.toFixed(1)}px, 12px)`;
        }

        if (scannerGroupRef.current) {
          const groupY = Math.sin(elapsed * 0.7) * 12;
          const groupRotY = (scrollNorm * 0.65 + smoothMouseX * 0.25) * 32;
          scannerGroupRef.current.style.transform = `translate3d(0px, ${groupY.toFixed(1)}px, -60px) rotateY(${groupRotY.toFixed(2)}deg)`;
        }

        // 3. Floating 3D PDF Document Pages
        const pages = pageRefs.current;
        for (let i = 0; i < PAGE_PLACEMENTS.length; i++) {
          const el = pages[i];
          if (!el) continue;
          const item = PAGE_PLACEMENTS[i];
          const phase = elapsed * item.floatSpeed + item.floatOffset + scrollNorm * 2.1;
          const side = item.xVw < 0 ? -1 : 1;

          const baseX = (item.xVw / 100) * vw;
          const baseY = (item.yVh / 100) * vh;

          let tx = baseX;
          let ty = baseY;
          let tz = item.zPx;
          let rx = item.rxDeg;
          let ry = item.ryDeg;
          let rz = item.rzDeg;

          if (currentMode === 'helix-spiral') {
            tx += Math.cos(phase) * item.orbitRadiusPx * 1.5 * side;
            ty += Math.sin(phase * 1.1) * 24;
            tz += Math.sin(phase) * 32;
            ry += side * Math.sin(scrollNorm * 1.8 + i) * 30;
            rz += side * Math.cos(phase * 0.8) * 8;
          } else if (currentMode === 'deep-zoom') {
            const zoomWave = Math.sin(scrollNorm * 2.4 + item.floatOffset);
            tx += Math.sin(phase * 0.7) * 13;
            ty += Math.cos(phase * 0.85) * 20;
            tz += zoomWave * 75;
            rx += zoomWave * 18;
            ry += smoothMouseX * 13;
          } else if (currentMode === 'orbit-wave') {
            const orbitWave = Math.sin(phase * 1.15 + i * 0.6);
            tx += Math.cos(phase * 0.95) * item.orbitRadiusPx * 1.8;
            ty += orbitWave * 28;
            tz += Math.cos(scrollNorm * 2.0 + i) * 44;
            rx += orbitWave * 16;
            ry += Math.sin(phase * 0.8) * 21;
          } else if (currentMode === 'prism-fold') {
            const parity = i % 2 === 0 ? -1 : 1;
            const foldAngle = Math.sin(scrollNorm * 2.1 + i * 0.45) * 26 * parity;
            tx += parity * Math.cos(phase * 0.8) * 16;
            ty += Math.sin(phase * 0.75) * 18;
            tz += Math.cos(scrollNorm * 1.9 + i) * 35;
            ry += foldAngle;
            rx += Math.cos(phase) * 11;
          } else {
            // Flip Cascade default wave
            tx += Math.sin(phase * 0.8) * item.orbitRadiusPx;
            ty += Math.cos(phase) * 22;
            tz += Math.sin(scrollNorm * 2.0 + i * 0.7) * 38;
            rx += Math.sin(scrollNorm * 2.2 + i * 0.5) * 22 + scrollVelocity * 14;
            ry += Math.cos(phase * 0.75) * 15 + smoothMouseX * 10;
          }

          el.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, ${tz.toFixed(1)}px) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg) rotateZ(${rz.toFixed(1)}deg) scale3d(${item.scale}, ${item.scale}, 1)`;
        }

        // 4. Floating Mint Geometric Rings & Polyhedra
        const rings = ringRefs.current;
        for (let i = 0; i < RING_PLACEMENTS.length; i++) {
          const rEl = rings[i];
          if (!rEl) continue;
          const rSpec = RING_PLACEMENTS[i];
          const rAngle = ringAngles[i];
          rAngle.x = (rAngle.x + dt * rSpec.rotSpeedX * scannerBoost) % 360;
          rAngle.y = (rAngle.y + dt * rSpec.rotSpeedY * scannerBoost) % 360;
          rAngle.z = (rAngle.z + dt * rSpec.rotSpeedZ * scannerBoost) % 360;

          const rxPos = (rSpec.xVw / 100) * vw;
          const ryPos =
            (rSpec.yVh / 100) * vh + Math.sin(elapsed * 0.9 + rSpec.floatOffset + scrollNorm) * 18;

          rEl.style.transform = `translate3d(${rxPos.toFixed(1)}px, ${ryPos.toFixed(1)}px, ${rSpec.zPx}px) rotateX(${rAngle.x.toFixed(1)}deg) rotateY(${rAngle.y.toFixed(1)}deg) rotateZ(${rAngle.z.toFixed(1)}deg)`;
        }

        // 5. Particle Field gentle swirl
        if (particleFieldRef.current) {
          const pRotZ = ((scrollNorm * 14 + elapsed * 2.3) % 360).toFixed(2);
          const pY = (((smoothScrollY * 0.14) % 90) - 45).toFixed(1);
          particleFieldRef.current.style.transform = `translate3d(0px, ${pY}px, -90px) rotateZ(${pRotZ}deg)`;
        }

        frameId = window.requestAnimationFrame(tick);
      };

      const startLoop = () => {
        if (disposed || isRunning || !isHeroVisible || !isTabVisible) return;
        isRunning = true;
        lastTime = performance.now();
        frameId = window.requestAnimationFrame(tick);
      };

      const stopLoop = () => {
        if (!isRunning) return;
        isRunning = false;
        if (frameId) {
          window.cancelAnimationFrame(frameId);
          frameId = 0;
        }
      };

      const syncLoopState = () => {
        if (isHeroVisible && isTabVisible && !disposed) {
          startLoop();
        } else {
          stopLoop();
        }
      };

      const onScroll = () => {
        targetScrollY = window.scrollY || 0;
        if (!isRunning) {
          updateProgressBarDirect(targetScrollY);
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        targetMouseX = (e.clientX / vw - 0.5) * 2;
        targetMouseY = -(e.clientY / vh - 0.5) * 2;
      };

      const onResize = () => {
        vw = Math.max(320, window.innerWidth || 1280);
        vh = Math.max(400, window.innerHeight || 800);
        maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
        updateProgressBarDirect(window.scrollY || 0);
      };

      const onVisibilityChange = () => {
        isTabVisible = !document.hidden;
        syncLoopState();
      };

      let observer: IntersectionObserver | null = null;
      const heroEl = document.getElementById('homepage-hero-section');
      if (typeof IntersectionObserver !== 'undefined' && heroEl) {
        observer = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry) {
              isHeroVisible = entry.isIntersecting;
              syncLoopState();
            }
          },
          { rootMargin: '240px 0px 240px 0px', threshold: 0 }
        );
        observer.observe(heroEl);
      }

      updateProgressBarDirect(targetScrollY);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      document.addEventListener('visibilitychange', onVisibilityChange);

      syncLoopState();

      return () => {
        disposed = true;
        stopLoop();
        observer?.disconnect();
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
    }, []);

    return (
      <>
        {/* 3D Emerald Laser Scroll Progress Bar at very top of page */}
        <div
          className="fixed top-0 left-0 right-0 z-[60] h-1 pointer-events-none overflow-hidden bg-emerald-950/10 dark:bg-emerald-950/30"
          aria-hidden="true"
          id="emerald-laser-scroll-bar-track"
        >
          <div
            ref={laserBarRef}
            id="emerald-laser-scroll-bar"
            className="emerald-laser-progress-bar h-full w-full origin-left"
          />
        </div>

        {/* Fixed pointer-events-none Pure CSS 3D Background Stage */}
        <div
          id="pdfminty-three-bg-canvas"
          className={`fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none transition-opacity duration-700 ease-out [perspective:1100px] ${
            fadedIn ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        >
          <div
            ref={stageCameraRef}
            className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d] will-change-transform"
          >
            {/* A. Centerpiece Dual-Ring 3D Holographic Scanner */}
            <div
              ref={scannerGroupRef}
              className="relative w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] flex items-center justify-center [transform-style:preserve-3d] will-change-transform"
            >
              {/* Outer Scanner Ring + 8 Orbital Nodes */}
              <div
                ref={outerRingRef}
                className="absolute inset-0 rounded-full border-[3px] border-emerald-500/40 dark:border-emerald-400/35 [transform-style:preserve-3d] will-change-transform"
              >
                {ORBITAL_NODE_ANGLES.map((deg) => (
                  <span
                    key={deg}
                    className="absolute top-1/2 left-1/2 -mt-1.5 -ml-1.5 w-3 h-3 rounded-xs bg-teal-400/75 dark:bg-emerald-400/80 border border-white/60"
                    style={{
                      transform: `rotateZ(${deg}deg) translateY(-170px) rotateZ(45deg)`,
                    }}
                  />
                ))}
              </div>

              {/* Inner Scanner Ring */}
              <div
                ref={innerRingRef}
                className="absolute w-[74%] h-[74%] rounded-full border-[2.5px] border-teal-500/45 dark:border-teal-400/40 [transform-style:preserve-3d] will-change-transform"
              />

              {/* Core Scanner Ring */}
              <div
                ref={coreRingRef}
                className="absolute w-[49%] h-[49%] rounded-full border-[2px] border-emerald-500/40 dark:border-emerald-300/35 [transform-style:preserve-3d] will-change-transform"
              />

              {/* Translucent Core Disc */}
              <div
                ref={coreDiscRef}
                className="absolute w-[46%] h-[46%] rounded-full bg-emerald-400/10 dark:bg-emerald-500/12 border border-emerald-400/25 will-change-transform"
              />

              {/* Sweeping Holographic Laser Scanline */}
              <div
                ref={laserScanLineRef}
                className="absolute w-[68%] h-[3px] rounded-full bg-gradient-to-r from-transparent via-emerald-400/75 to-transparent will-change-transform"
              />
            </div>

            {/* B. Floating 3D PDF Document Pages (10 Stylized 3D Cards) */}
            {PAGE_PLACEMENTS.map((_, idx) => (
              <div
                key={`pdf-3d-page-${idx}`}
                ref={(el) => {
                  pageRefs.current[idx] = el;
                }}
                className="absolute w-[84px] h-[112px] sm:w-[96px] sm:h-[128px] rounded-lg bg-white/80 dark:bg-[#0f1f1c]/80 border border-emerald-500/35 dark:border-emerald-500/40 p-2 flex flex-col justify-between [transform-style:preserve-3d] [backface-visibility:hidden] will-change-transform"
              >
                {/* Top Header Row: Emerald PDF Badge + Verification Dot */}
                <div className="flex items-center justify-between [transform:translateZ(6px)]">
                  <span className="px-1.5 py-0.5 rounded-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-[8px] font-extrabold text-white tracking-wider leading-none">
                    PDF
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 dark:bg-emerald-400/25 border border-emerald-500/40" />
                </div>

                {/* Simulated Document Lines */}
                <div className="space-y-1 my-1">
                  {DOC_LINE_WIDTHS.map((widthPct, lineIdx) => (
                    <div
                      key={lineIdx}
                      className={`h-[3px] rounded-full ${
                        lineIdx % 3 === 0
                          ? 'bg-slate-800/25 dark:bg-slate-200/40'
                          : 'bg-slate-500/15 dark:bg-slate-400/25'
                      }`}
                      style={{ width: widthPct }}
                    />
                  ))}
                </div>

                {/* Bottom Mint Analytics Box + Corner Seal */}
                <div className="relative h-5 rounded-xs bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-500/35 px-1.5 pb-0.5 flex items-end gap-0.5 [transform:translateZ(5px)]">
                  {MINI_BAR_HEIGHTS.map((hPct, barIdx) => (
                    <span
                      key={barIdx}
                      className={`flex-1 rounded-t-[1px] ${
                        barIdx % 2 === 0 ? 'bg-emerald-500/80' : 'bg-teal-500/80'
                      }`}
                      style={{ height: hPct }}
                    />
                  ))}
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400/90 border border-white/70 ml-0.5 shrink-0" />
                </div>
              </div>
            ))}

            {/* C. Floating Mint Geometric Rings & Polyhedra */}
            {RING_PLACEMENTS.map((spec, idx) => (
              <div
                key={`mint-geo-${idx}`}
                ref={(el) => {
                  ringRefs.current[idx] = el;
                }}
                className={
                  spec.isCrystal
                    ? 'absolute w-7 h-7 rounded-sm border-2 border-emerald-400/45 bg-emerald-400/12 will-change-transform'
                    : 'absolute w-12 h-12 rounded-full border-2 border-emerald-400/40 will-change-transform'
                }
              />
            ))}

            {/* D. Mint Particle Field */}
            <div
              ref={particleFieldRef}
              className="absolute inset-0 will-change-transform"
            >
              {PARTICLE_COORDS.map((pt, idx) => (
                <span
                  key={`mint-pt-${idx}`}
                  className="absolute w-1.5 h-1.5 rounded-full bg-emerald-500/35 dark:bg-emerald-400/35"
                  style={{
                    left: pt.left,
                    top: pt.top,
                    transform: `scale(${pt.scale})`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }
);

HomeThreeBackground.displayName = 'HomeThreeBackground';
