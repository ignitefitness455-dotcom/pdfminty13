import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { useTheme } from '../../contexts/ThemeContext';

import { type Active3DAnimation } from './scroll3dConfig';

interface HomeThreeBackgroundProps {
  activeAnimation: Active3DAnimation;
}

interface FloatingPdfPageItem {
  group: THREE.Group;
  basePos: THREE.Vector3;
  baseRot: THREE.Euler;
  floatSpeed: number;
  floatOffset: number;
  orbitRadius: number;
}

interface FloatingRingItem {
  mesh: THREE.Mesh;
  basePos: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  floatOffset: number;
}

/**
 * Generates a crisp procedural 2D CanvasTexture representing a stylized PDF document page
 * with an emerald header badge, document lines, and verification seal.
 */
function createProceduralPdfPageTexture(
  renderer: THREE.WebGLRenderer,
  isDark: boolean
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Paper base
  ctx.fillStyle = isDark ? '#0f1f1c' : '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle mint border
  ctx.strokeStyle = isDark ? 'rgba(16, 185, 129, 0.45)' : 'rgba(16, 185, 129, 0.35)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

  // Top emerald PDF header banner
  const grad = ctx.createLinearGradient(0, 0, canvas.width, 54);
  grad.addColorStop(0, '#10b981');
  grad.addColorStop(1, '#0d9488');
  ctx.fillStyle = grad;
  ctx.fillRect(18, 20, 92, 32);

  // "PDF" label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('PDF', 38, 42);

  // Top-right mini verification circle
  ctx.beginPath();
  ctx.arc(214, 36, 12, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? 'rgba(52, 211, 153, 0.25)' : 'rgba(16, 185, 129, 0.16)';
  ctx.fill();

  // Document text lines
  const lineColors = isDark
    ? ['rgba(203, 213, 225, 0.45)', 'rgba(148, 163, 184, 0.28)']
    : ['rgba(15, 23, 42, 0.22)', 'rgba(71, 85, 105, 0.15)'];

  const widths = [210, 185, 200, 150, 210, 195, 175, 130];
  let y = 78;
  widths.forEach((w, idx) => {
    ctx.fillStyle = idx % 3 === 0 ? lineColors[0] : lineColors[1];
    ctx.fillRect(22, y, w, 9);
    y += 22;
  });

  // Mint holographic analytics box at bottom of page
  ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.14)' : 'rgba(236, 253, 245, 0.95)';
  ctx.fillRect(22, 260, 212, 54);
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 260, 212, 54);

  // Mini bars inside box
  const barHeights = [18, 30, 24, 36, 28, 38];
  barHeights.forEach((bh, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#10b981' : '#14b8a6';
    ctx.fillRect(38 + idx * 28, 304 - bh, 16, bh);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;
  return texture;
}

/**
 * Composite 4-part 3D PDF Document Page Group:
 * (1) Primary paper sheet hull, (2) Procedural front page print surface,
 * (3) Raised 3D emerald header bar, and (4) Corner security seal tab.
 */
function buildCompositePdfDocumentGroup(
  pageGeo: THREE.BoxGeometry,
  faceGeo: THREE.PlaneGeometry,
  barGeo: THREE.BoxGeometry,
  sealGeo: THREE.CylinderGeometry,
  paperMat: THREE.MeshStandardMaterial,
  faceMat: THREE.MeshStandardMaterial,
  emeraldAccentMat: THREE.MeshStandardMaterial,
  goldSealMat: THREE.MeshStandardMaterial
): THREE.Group {
  const group = new THREE.Group();

  const sheetMesh = new THREE.Mesh(pageGeo, paperMat);
  group.add(sheetMesh);

  const frontFace = new THREE.Mesh(faceGeo, faceMat);
  frontFace.position.z = 0.028;
  group.add(frontFace);

  const headerBar = new THREE.Mesh(barGeo, emeraldAccentMat);
  headerBar.position.set(-0.26, 0.56, 0.042);
  group.add(headerBar);

  const sealMesh = new THREE.Mesh(sealGeo, goldSealMat);
  sealMesh.rotation.x = Math.PI / 2;
  sealMesh.position.set(0.42, -0.52, 0.042);
  group.add(sealMesh);

  return group;
}

export const HomeThreeBackground: React.FC<HomeThreeBackgroundProps> = React.memo(
  ({ activeAnimation }) => {
    const { isDark } = useTheme();
    const canvasMountRef = useRef<HTMLDivElement | null>(null);
    const laserBarRef = useRef<HTMLDivElement | null>(null);
    const activeAnimRef = useRef<Active3DAnimation>(activeAnimation);
    const isDarkRef = useRef<boolean>(isDark);

    useEffect(() => {
      activeAnimRef.current = activeAnimation;
    }, [activeAnimation]);

    useEffect(() => {
      isDarkRef.current = isDark;
    }, [isDark]);

    // 1. High-precision 3D Emerald Laser Scroll Progress Bar updater
    useEffect(() => {
      if (typeof window === 'undefined') return undefined;
      let rafId = 0;

      const updateProgressBar = () => {
        rafId = 0;
        const barEl = laserBarRef.current;
        if (!barEl) return;
        const docEl = document.documentElement;
        const maxScroll = Math.max(1, docEl.scrollHeight - window.innerHeight);
        const rawProgress = Math.max(0.02, Math.min(1, window.scrollY / maxScroll));
        barEl.style.setProperty('--laser-progress', rawProgress.toFixed(4));
      };

      const onScroll = () => {
        if (!rafId) {
          rafId = window.requestAnimationFrame(updateProgressBar);
        }
      };

      updateProgressBar();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      return () => {
        if (rafId) window.cancelAnimationFrame(rafId);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    }, []);

    // 2. Three.js 3D Background Canvas (Floating 3D PDF Pages, Mint Rings, Particles & Dual-Ring 3D Holographic Scanner)
    useEffect(() => {
      if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;
      // Skip WebGL initialization in headless unit test environments (jsdom)
      if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')) {
        return undefined;
      }
      if (
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return undefined;
      }

      const container = canvasMountRef.current;
      if (!container) return undefined;

      // Probe WebGL support and detect software WebGL per Three.js skill guidelines
      let isSoftwareGl = false;
      try {
        const probeCanvas = document.createElement('canvas');
        const gl =
          probeCanvas.getContext('webgl2') ||
          probeCanvas.getContext('webgl') ||
          probeCanvas.getContext('experimental-webgl');
        if (!gl) return undefined;
        if ('getExtension' in gl && 'getParameter' in gl) {
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
          const gpu = String(gl.getParameter(param));
          isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
      } catch {
        return undefined;
      }

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: !isSoftwareGl,
          alpha: true,
          powerPreference: 'high-performance',
        });
      } catch {
        return undefined;
      }

      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);

      const domCanvas = renderer.domElement;
      domCanvas.className = 'w-full h-full block pointer-events-none';
      container.innerHTML = '';
      container.appendChild(domCanvas);

      const scene = new THREE.Scene();
      const fogColor = new THREE.Color(isDarkRef.current ? 0x0b0f19 : 0xf4faf7);
      scene.fog = new THREE.FogExp2(fogColor, 0.032);

      // Studio environment reflections
      let envTexture: THREE.Texture | null = null;
      try {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = envTexture;
        pmremGenerator.dispose();
      } catch {
        // Safe fallback if PMREM fails on constrained contexts
      }

      const camera = new THREE.PerspectiveCamera(
        52,
        Math.max(1, window.innerWidth) / Math.max(1, window.innerHeight),
        0.1,
        120
      );
      camera.position.set(0, 0.4, 13.5);

      // Balanced 3-point + core lighting rig
      const hemiLight = new THREE.HemisphereLight(0xecfdf5, 0x047857, 1.15);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
      keyLight.position.set(7, 10, 9);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x2dd4bf, 0.95);
      rimLight.position.set(-8, -5, -4);
      scene.add(rimLight);

      const scannerLight = new THREE.PointLight(0x10b981, 2.2, 18);
      scannerLight.position.set(0, 0.2, 1.5);
      scene.add(scannerLight);

      // Shared geometries & materials (disposed on unmount)
      const disposableGeos: THREE.BufferGeometry[] = [];
      const disposableMats: THREE.Material[] = [];
      const disposableTextures: THREE.Texture[] = [];
      if (envTexture) disposableTextures.push(envTexture);

      // --- A. Centerpiece Dual-Ring 3D Holographic Scanner Group (7 composite parts) ---
      const scannerGroup = new THREE.Group();
      scannerGroup.position.set(0, 0.2, -1.8);
      scene.add(scannerGroup);

      const outerRingGeo = new THREE.TorusGeometry(3.15, 0.045, 20, 96);
      const innerRingGeo = new THREE.TorusGeometry(2.35, 0.038, 18, 84);
      const coreRingGeo = new THREE.TorusGeometry(1.55, 0.022, 16, 64);
      const coreDiscGeo = new THREE.CylinderGeometry(1.48, 1.48, 0.04, 48);
      const laserBeamGeo = new THREE.BoxGeometry(4.4, 0.045, 0.09);
      const nodeGeo = new THREE.OctahedronGeometry(0.11, 0);
      disposableGeos.push(
        outerRingGeo,
        innerRingGeo,
        coreRingGeo,
        coreDiscGeo,
        laserBeamGeo,
        nodeGeo
      );

      const outerRingMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.35,
        metalness: 0.78,
        roughness: 0.2,
        transparent: true,
        opacity: 0.42,
      });
      const innerRingMat = new THREE.MeshStandardMaterial({
        color: 0x14b8a6,
        emissive: 0x0d9488,
        emissiveIntensity: 0.4,
        metalness: 0.85,
        roughness: 0.16,
        transparent: true,
        opacity: 0.46,
      });
      const coreDiscMat = new THREE.MeshPhysicalMaterial({
        color: 0x6ee7b7,
        emissive: 0x10b981,
        emissiveIntensity: 0.18,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
      });
      const laserBeamMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.62,
      });
      disposableMats.push(outerRingMat, innerRingMat, coreDiscMat, laserBeamMat);

      const outerScannerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
      scannerGroup.add(outerScannerRing);

      const innerScannerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
      innerScannerRing.rotation.set(Math.PI / 3.2, Math.PI / 5, 0);
      scannerGroup.add(innerScannerRing);

      const coreScannerRing = new THREE.Mesh(coreRingGeo, outerRingMat);
      coreScannerRing.rotation.set(-Math.PI / 4, 0, Math.PI / 6);
      scannerGroup.add(coreScannerRing);

      const coreScannerDisc = new THREE.Mesh(coreDiscGeo, coreDiscMat);
      coreScannerDisc.rotation.x = Math.PI / 2;
      scannerGroup.add(coreScannerDisc);

      const laserScanLine = new THREE.Mesh(laserBeamGeo, laserBeamMat);
      laserScanLine.position.set(0, 0, 0.18);
      scannerGroup.add(laserScanLine);

      // 8 orbital holographic nodes around the outer scanner ring
      const nodeCount = 8;
      const orbitalNodes = new THREE.InstancedMesh(nodeGeo, innerRingMat, nodeCount);
      const dummyObj = new THREE.Object3D();
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        dummyObj.position.set(Math.cos(angle) * 3.15, Math.sin(angle) * 3.15, 0);
        dummyObj.rotation.set(angle, angle * 0.5, 0);
        dummyObj.updateMatrix();
        orbitalNodes.setMatrixAt(i, dummyObj.matrix);
      }
      orbitalNodes.instanceMatrix.needsUpdate = true;
      orbitalNodes.computeBoundingSphere();
      outerScannerRing.add(orbitalNodes);

      // --- B. Floating 3D PDF Document Pages (10 Composite Multi-Part Groups) ---
      const pageGeo = new THREE.BoxGeometry(1.22, 1.62, 0.048);
      const faceGeo = new THREE.PlaneGeometry(1.16, 1.56);
      const barGeo = new THREE.BoxGeometry(0.48, 0.14, 0.024);
      const sealGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.024, 24);
      disposableGeos.push(pageGeo, faceGeo, barGeo, sealGeo);

      const pdfTexture = createProceduralPdfPageTexture(renderer, isDarkRef.current);
      if (pdfTexture) disposableTextures.push(pdfTexture);

      const paperMat = new THREE.MeshStandardMaterial({
        color: isDarkRef.current ? 0x11221f : 0xf8fafc,
        roughness: 0.42,
        metalness: 0.08,
        transparent: true,
        opacity: 0.76,
      });
      const faceMat = new THREE.MeshStandardMaterial({
        map: pdfTexture || null,
        color: 0xffffff,
        roughness: 0.32,
        metalness: 0.05,
        transparent: true,
        opacity: 0.82,
      });
      const emeraldAccentMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.25,
        roughness: 0.22,
        metalness: 0.65,
      });
      const goldSealMat = new THREE.MeshStandardMaterial({
        color: 0x2dd4bf,
        emissive: 0x0d9488,
        emissiveIntensity: 0.3,
        roughness: 0.18,
        metalness: 0.85,
      });
      disposableMats.push(paperMat, faceMat, emeraldAccentMat, goldSealMat);

      const pdfPageItems: FloatingPdfPageItem[] = [];
      const pagePlacements: [number, number, number, number, number, number][] = [
        [-6.4, 3.1, -2.2, 0.18, 0.38, -0.12],
        [6.5, 2.9, -2.5, -0.15, -0.42, 0.14],
        [-5.6, -2.4, -1.8, 0.22, 0.32, 0.09],
        [5.8, -2.6, -2.0, -0.2, -0.35, -0.11],
        [-3.6, 4.2, -4.6, 0.12, 0.25, -0.18],
        [3.8, 4.0, -4.8, -0.14, -0.28, 0.16],
        [-7.5, 0.3, -4.2, 0.08, 0.48, -0.06],
        [7.6, -0.1, -4.4, -0.1, -0.46, 0.08],
        [-3.2, -4.3, -4.5, 0.24, 0.2, 0.15],
        [3.4, -4.1, -4.7, -0.22, -0.22, -0.14],
      ];

      pagePlacements.forEach(([x, y, z, rx, ry, rz], idx) => {
        const docGroup = buildCompositePdfDocumentGroup(
          pageGeo,
          faceGeo,
          barGeo,
          sealGeo,
          paperMat,
          faceMat,
          emeraldAccentMat,
          goldSealMat
        );
        docGroup.position.set(x, y, z);
        docGroup.rotation.set(rx, ry, rz);
        const scale = idx < 4 ? 0.92 : 0.76;
        docGroup.scale.setScalar(scale);
        scene.add(docGroup);

        pdfPageItems.push({
          group: docGroup,
          basePos: new THREE.Vector3(x, y, z),
          baseRot: new THREE.Euler(rx, ry, rz),
          floatSpeed: 0.65 + (idx % 4) * 0.18,
          floatOffset: idx * 1.15,
          orbitRadius: 0.28 + (idx % 3) * 0.12,
        });
      });

      // --- C. Mint Geometric Rings & Polyhedra ---
      const miniRingGeo = new THREE.TorusGeometry(0.68, 0.026, 14, 48);
      const crystalGeo = new THREE.IcosahedronGeometry(0.32, 0);
      disposableGeos.push(miniRingGeo, crystalGeo);

      const mintGeoMat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 0.22,
        metalness: 0.72,
        roughness: 0.24,
        transparent: true,
        opacity: 0.38,
      });
      disposableMats.push(mintGeoMat);

      const floatingRings: FloatingRingItem[] = [];
      const ringCoords: [number, number, number][] = [
        [-4.5, 1.2, -3.2],
        [4.7, 1.4, -3.4],
        [-4.2, -3.6, -3.0],
        [4.4, -3.4, -3.3],
        [0, 4.6, -5.2],
        [0, -4.6, -5.0],
      ];
      ringCoords.forEach(([x, y, z], idx) => {
        const mesh = new THREE.Mesh(idx % 2 === 0 ? miniRingGeo : crystalGeo, mintGeoMat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        floatingRings.push({
          mesh,
          basePos: new THREE.Vector3(x, y, z),
          rotSpeed: new THREE.Vector3(
            0.35 + idx * 0.06,
            0.48 - idx * 0.05,
            0.25 + (idx % 2) * 0.15
          ),
          floatOffset: idx * 0.95,
        });
      });

      // --- D. Mint Particle Field (InstancedMesh for crisp spheres, > 20 instances) ---
      const particleCount = 56;
      const particleGeo = new THREE.OctahedronGeometry(0.055, 0);
      const particleMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.36,
      });
      disposableGeos.push(particleGeo);
      disposableMats.push(particleMat);

      const particleInstanced = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
      particleInstanced.frustumCulled = false;
      const particleBasePositions: THREE.Vector3[] = [];
      for (let i = 0; i < particleCount; i++) {
        // Deterministic golden-angle spiral distribution across viewport
        const t = i / particleCount;
        const angle = i * 2.39996;
        const radius = 2.2 + t * 8.2;
        const px = Math.cos(angle) * radius * 1.15;
        const py = Math.sin(angle) * radius * 0.78;
        const pz = -1.2 - (i % 7) * 0.85;
        particleBasePositions.push(new THREE.Vector3(px, py, pz));
        dummyObj.position.set(px, py, pz);
        dummyObj.scale.setScalar(0.75 + (i % 4) * 0.22);
        dummyObj.updateMatrix();
        particleInstanced.setMatrixAt(i, dummyObj.matrix);
      }
      particleInstanced.instanceMatrix.needsUpdate = true;
      particleInstanced.computeBoundingSphere();
      scene.add(particleInstanced);

      // Pre-warm shaders when hardware accelerated
      if (!isSoftwareGl) {
        try {
          renderer.compile(scene, camera);
        } catch {
          // Ignore shader pre-warm issues
        }
      }

      // Scroll & Mouse state tracking (zero React re-renders)
      let targetScrollY = window.scrollY || 0;
      let smoothScrollY = targetScrollY;
      let scrollVelocity = 0;
      let targetMouseX = 0;
      let targetMouseY = 0;
      let smoothMouseX = 0;
      let smoothMouseY = 0;

      const onScroll = () => {
        targetScrollY = window.scrollY || 0;
      };

      const onPointerMove = (e: PointerEvent) => {
        const w = Math.max(1, window.innerWidth);
        const h = Math.max(1, window.innerHeight);
        targetMouseX = (e.clientX / w - 0.5) * 2;
        targetMouseY = -(e.clientY / h - 0.5) * 2;
      };

      const onResize = () => {
        const w = Math.max(1, window.innerWidth);
        const h = Math.max(1, window.innerHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      let contextLost = false;
      const onContextLost = (e: Event) => {
        e.preventDefault();
        contextLost = true;
      };
      const onContextRestored = () => {
        contextLost = false;
      };

      domCanvas.addEventListener('webglcontextlost', onContextLost);
      domCanvas.addEventListener('webglcontextrestored', onContextRestored);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });

      const clock = new THREE.Clock();
      let frameId = 0;
      let disposed = false;

      // Software-WebGL GPU sync pacing per Three.js skill directive
      const afterDraw = (cb: () => void) => {
        if (disposed) return;
        const gl = renderer.getContext() as WebGL2RenderingContext | null;
        if (!gl || typeof gl.fenceSync !== 'function') {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      };

      const tick = () => {
        if (disposed) return;
        const dt = Math.min(0.05, Math.max(0.001, clock.getDelta()));
        const elapsed = clock.getElapsedTime();

        // Update theme fog/paper tint smoothly if theme toggled
        const targetFogHex = isDarkRef.current ? 0x0b0f19 : 0xf4faf7;
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.lerp(fogColor.setHex(targetFogHex), 0.1);
        }
        paperMat.color.setHex(isDarkRef.current ? 0x11221f : 0xf8fafc);

        // Exponential damping for scroll and pointer coordinates
        const prevSmoothScroll = smoothScrollY;
        smoothScrollY = THREE.MathUtils.damp(smoothScrollY, targetScrollY, 7.5, dt);
        const rawVel = (smoothScrollY - prevSmoothScroll) / Math.max(0.008, dt * 600);
        scrollVelocity = THREE.MathUtils.damp(scrollVelocity, rawVel, 6, dt);

        smoothMouseX = THREE.MathUtils.damp(smoothMouseX, targetMouseX, 5, dt);
        smoothMouseY = THREE.MathUtils.damp(smoothMouseY, targetMouseY, 5, dt);

        const scrollNorm = smoothScrollY * 0.0018;
        const currentMode = activeAnimRef.current;

        // 1. Camera angle & depth animation coupled to scroll + mouse parallax
        const modeCamZOffset =
          currentMode === 'deep-zoom'
            ? Math.sin(scrollNorm * 1.6) * 1.15
            : currentMode === 'helix-spiral'
              ? Math.cos(scrollNorm * 1.2) * 0.65
              : currentMode === 'orbit-wave'
                ? Math.sin(scrollNorm * 1.3) * 0.85
                : 0;
        camera.position.x = smoothMouseX * 0.85 + Math.sin(scrollNorm * 0.9) * 0.45;
        camera.position.y = 0.4 + smoothMouseY * 0.55 - Math.sin(scrollNorm * 0.65) * 0.5;
        camera.position.z = 13.5 + modeCamZOffset - Math.min(1.4, Math.abs(scrollVelocity) * 0.6);
        camera.lookAt(smoothMouseX * 0.25, -Math.sin(scrollNorm * 0.4) * 0.25, -1.5);
        camera.rotation.z =
          currentMode === 'helix-spiral' || currentMode === 'orbit-wave'
            ? Math.sin(scrollNorm * 1.4) * 0.045 + smoothMouseX * -0.02
            : smoothMouseX * -0.015;

        // 2. Dual-Ring 3D Holographic Scanner animation
        const scannerSpeedBoost = 1 + Math.min(2.5, Math.abs(scrollVelocity) * 2.2);
        outerScannerRing.rotation.z += dt * 0.28 * scannerSpeedBoost;
        outerScannerRing.rotation.x =
          Math.sin(elapsed * 0.55 + scrollNorm) * 0.28 + smoothMouseY * 0.18;
        outerScannerRing.rotation.y =
          Math.cos(elapsed * 0.45 + scrollNorm * 1.3) * 0.32 + smoothMouseX * 0.22;

        innerScannerRing.rotation.x += dt * 0.52 * scannerSpeedBoost;
        innerScannerRing.rotation.y -= dt * 0.38 * scannerSpeedBoost;

        coreScannerRing.rotation.z -= dt * 0.65 * scannerSpeedBoost;
        coreScannerDisc.rotation.z = elapsed * 0.4 + scrollNorm * 2.0;

        // Sweeping holographic laser scanline inside the dual ring
        laserScanLine.position.y = Math.sin(elapsed * 2.1 + scrollNorm * 3.5) * 1.45;
        scannerGroup.position.y = 0.2 + Math.sin(elapsed * 0.7) * 0.18;
        scannerGroup.rotation.y = scrollNorm * 0.65 + smoothMouseX * 0.25;

        // 3. Floating 3D PDF Document Pages animation
        for (let i = 0; i < pdfPageItems.length; i++) {
          const item = pdfPageItems[i];
          const phase = elapsed * item.floatSpeed + item.floatOffset + scrollNorm * 2.1;
          const side = item.basePos.x < 0 ? -1 : 1;

          if (currentMode === 'helix-spiral') {
            item.group.position.x =
              item.basePos.x + Math.cos(phase) * item.orbitRadius * 1.5 * side;
            item.group.position.y = item.basePos.y + Math.sin(phase * 1.1) * 0.42;
            item.group.position.z = item.basePos.z + Math.sin(phase) * 0.55;
            item.group.rotation.y = item.baseRot.y + side * Math.sin(scrollNorm * 1.8 + i) * 0.52;
            item.group.rotation.z = item.baseRot.z + side * Math.cos(phase * 0.8) * 0.14;
          } else if (currentMode === 'deep-zoom') {
            const zoomWave = Math.sin(scrollNorm * 2.4 + item.floatOffset);
            item.group.position.x = item.basePos.x + Math.sin(phase * 0.7) * 0.22;
            item.group.position.y = item.basePos.y + Math.cos(phase * 0.85) * 0.35;
            item.group.position.z = item.basePos.z + zoomWave * 1.25;
            item.group.rotation.x = item.baseRot.x + zoomWave * 0.32;
            item.group.rotation.y = item.baseRot.y + smoothMouseX * 0.22;
          } else if (currentMode === 'orbit-wave') {
            const orbitWave = Math.sin(phase * 1.15 + i * 0.6);
            item.group.position.x = item.basePos.x + Math.cos(phase * 0.95) * item.orbitRadius * 1.8;
            item.group.position.y = item.basePos.y + orbitWave * 0.48;
            item.group.position.z = item.basePos.z + Math.cos(scrollNorm * 2.0 + i) * 0.75;
            item.group.rotation.x = item.baseRot.x + orbitWave * 0.28;
            item.group.rotation.y = item.baseRot.y + Math.sin(phase * 0.8) * 0.36;
          } else if (currentMode === 'prism-fold') {
            const parity = i % 2 === 0 ? -1 : 1;
            const foldAngle = Math.sin(scrollNorm * 2.1 + i * 0.45) * 0.45 * parity;
            item.group.position.x = item.basePos.x + parity * Math.cos(phase * 0.8) * 0.28;
            item.group.position.y = item.basePos.y + Math.sin(phase * 0.75) * 0.32;
            item.group.position.z = item.basePos.z + Math.cos(scrollNorm * 1.9 + i) * 0.6;
            item.group.rotation.y = item.baseRot.y + foldAngle;
            item.group.rotation.x = item.baseRot.x + Math.cos(phase) * 0.2;
          } else {
            // Flip Cascade default wave
            item.group.position.x = item.basePos.x + Math.sin(phase * 0.8) * item.orbitRadius;
            item.group.position.y = item.basePos.y + Math.cos(phase) * 0.38;
            item.group.position.z = item.basePos.z + Math.sin(scrollNorm * 2.0 + i * 0.7) * 0.65;
            item.group.rotation.x =
              item.baseRot.x + Math.sin(scrollNorm * 2.2 + i * 0.5) * 0.38 + scrollVelocity * 0.25;
            item.group.rotation.y =
              item.baseRot.y + Math.cos(phase * 0.75) * 0.26 + smoothMouseX * 0.18;
          }
        }

        // 4. Floating Mint Geometric Rings & Polyhedra
        for (let i = 0; i < floatingRings.length; i++) {
          const rItem = floatingRings[i];
          rItem.mesh.rotation.x += dt * rItem.rotSpeed.x * scannerSpeedBoost;
          rItem.mesh.rotation.y += dt * rItem.rotSpeed.y * scannerSpeedBoost;
          rItem.mesh.position.y =
            rItem.basePos.y + Math.sin(elapsed * 0.9 + rItem.floatOffset + scrollNorm) * 0.32;
        }

        // 5. Particle Field gentle swirl
        particleInstanced.rotation.z = scrollNorm * 0.25 + elapsed * 0.04;
        particleInstanced.position.y = ((smoothScrollY * 0.0025) % 1.8) - 0.9;

        if (!contextLost && !document.hidden) {
          renderer.render(scene, camera);
        }

        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = window.requestAnimationFrame(tick);
        }
      };

      frameId = window.requestAnimationFrame(tick);

      return () => {
        disposed = true;
        window.cancelAnimationFrame(frameId);
        window.clearTimeout(frameId);
        domCanvas.removeEventListener('webglcontextlost', onContextLost);
        domCanvas.removeEventListener('webglcontextrestored', onContextRestored);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('resize', onResize);

        disposableGeos.forEach((g) => g.dispose());
        disposableMats.forEach((m) => m.dispose());
        disposableTextures.forEach((t) => t.dispose());
        try {
          renderer.forceContextLoss();
        } catch {
          // Ignore context loss errors during disposal
        }
        renderer.dispose();
        if (domCanvas.parentNode === container) {
          container.removeChild(domCanvas);
        }
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

        {/* Fixed pointer-events-none Three.js 3D Background Canvas */}
        <div
          ref={canvasMountRef}
          id="pdfminty-three-bg-canvas"
          className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none"
          aria-hidden="true"
        />
      </>
    );
  }
);

HomeThreeBackground.displayName = 'HomeThreeBackground';
