export type Scroll3DMode =
  | 'auto'
  | 'flip-cascade'
  | 'helix-spiral'
  | 'deep-zoom'
  | 'orbit-wave'
  | 'prism-fold';

export type Active3DAnimation =
  | 'flip-cascade'
  | 'helix-spiral'
  | 'deep-zoom'
  | 'orbit-wave'
  | 'prism-fold';

export interface AnimationOptionMeta {
  id: Scroll3DMode;
  label: string;
  shortName: string;
}

export const SCROLL_3D_OPTIONS: readonly AnimationOptionMeta[] = [
  { id: 'auto', label: '🔄 Auto', shortName: 'Auto' },
  { id: 'flip-cascade', label: '1. 3D Flip Cascade', shortName: '1. 3D Flip Cascade' },
  { id: 'helix-spiral', label: '2. 3D Helix Spiral', shortName: '2. 3D Helix Spiral' },
  { id: 'deep-zoom', label: '3. 3D Deep Zoom', shortName: '3. 3D Deep Zoom' },
  { id: 'orbit-wave', label: '4. 3D Orbit Wave', shortName: '4. 3D Orbit Wave' },
  { id: 'prism-fold', label: '5. 3D Prism Fold', shortName: '5. 3D Prism Fold' },
] as const;

export const AUTO_CYCLE_SEQUENCE: readonly Active3DAnimation[] = [
  'flip-cascade',
  'helix-spiral',
  'deep-zoom',
  'orbit-wave',
  'prism-fold',
] as const;

/**
 * Distance in pixels of vertical scroll per automatic 3D animation switch
 * (~350px-420px as requested: 380px per step).
 */
export const AUTO_SCROLL_STEP_PX = 380;

export interface AutoCycleResolution {
  current: Active3DAnimation;
  next: Active3DAnimation;
  blendFactor: number;
  stepIndex: number;
}

/**
 * Resolves which 3D animation is currently active when `Auto` mode is enabled,
 * plus a smooth blend factor near segment boundaries so transitions glide seamlessly.
 */
export function resolveAuto3DAnimation(scrollY: number): AutoCycleResolution {
  const safeScroll = Math.max(0, Number.isFinite(scrollY) ? scrollY : 0);
  const rawIndex = Math.floor(safeScroll / AUTO_SCROLL_STEP_PX);
  const stepIndex =
    ((rawIndex % AUTO_CYCLE_SEQUENCE.length) + AUTO_CYCLE_SEQUENCE.length) %
    AUTO_CYCLE_SEQUENCE.length;
  const nextIndex = (stepIndex + 1) % AUTO_CYCLE_SEQUENCE.length;

  const progressInStep = (safeScroll % AUTO_SCROLL_STEP_PX) / AUTO_SCROLL_STEP_PX;
  // Smoothly blend during the final 22% of each 380px scroll band
  const blendStart = 0.78;
  const rawBlend =
    progressInStep > blendStart ? (progressInStep - blendStart) / (1 - blendStart) : 0;
  // Smoothstep curve: 3t^2 - 2t^3
  const blendFactor = rawBlend * rawBlend * (3 - 2 * rawBlend);

  return {
    current: AUTO_CYCLE_SEQUENCE[stepIndex],
    next: AUTO_CYCLE_SEQUENCE[nextIndex],
    blendFactor,
    stepIndex,
  };
}

export function getAnimationDisplayName(anim: Active3DAnimation): string {
  switch (anim) {
    case 'flip-cascade':
      return '1. 3D Flip Cascade';
    case 'helix-spiral':
      return '2. 3D Helix Spiral';
    case 'deep-zoom':
      return '3. 3D Deep Zoom';
    case 'orbit-wave':
      return '4. 3D Orbit Wave';
    case 'prism-fold':
      return '5. 3D Prism Fold';
  }
}

export interface Card3DTransformInput {
  mode: Active3DAnimation;
  /** Normalized vertical distance from viewport center (-1.35 to +1.35; 0 = exact center) */
  normDist: number;
  /** Column index in current grid (0..cols-1) */
  colIndex: number;
  /** Total columns in current grid (1..4) */
  totalCols: number;
  /** Row index in current grid */
  rowIndex: number;
  /** Card index inside section */
  cardIndex: number;
  /** Current window.scrollY in px */
  scrollY: number;
  /** Smoothed scroll velocity (-1..1) */
  scrollVelocity: number;
}

export interface Card3DTransformValues {
  rx: number;
  ry: number;
  rz: number;
  tx: number;
  ty: number;
  tz: number;
  scale: number;
  shimmerAngle: number;
  shimmerOpacity: number;
  spotlightOpacity: number;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Computes pure 3D transform values for a single animation mode.
 */
export function computeSingleModeCardTransform(input: Card3DTransformInput): Card3DTransformValues {
  const { mode, normDist, colIndex, totalCols, rowIndex, cardIndex, scrollY, scrollVelocity } =
    input;

  const clampedDist = clamp(normDist, -1.35, 1.35);
  const absDist = Math.abs(clampedDist);
  const centerProximity = Math.max(0, 1 - absDist / 0.68);
  const colCenter = (Math.max(1, totalCols) - 1) / 2;
  const colOffset = totalCols > 1 ? (colIndex - colCenter) / Math.max(0.5, colCenter) : 0;
  const sideSign = colOffset < 0 ? -1 : colOffset > 0 ? 1 : cardIndex % 2 === 0 ? -1 : 1;

  const scrollPhase = scrollY * 0.0085;
  const waveSin = Math.sin(scrollPhase + cardIndex * 0.55 + rowIndex * 0.4);
  const waveCos = Math.cos(scrollPhase * 0.9 + colIndex * 0.7 + rowIndex * 0.35);
  const velocityBoost = clamp(scrollVelocity * 0.45, -0.65, 0.65);

  let rx = 0;
  let ry = 0;
  let rz = 0;
  let tx = 0;
  let ty = 0;
  let tz = 0;
  let scale = 1;

  if (mode === 'flip-cascade') {
    // 1. 3D Flip Cascade: perspective(1100px) 3D deck wave with rotateX, rotateY, translateZ
    const cascadeWave = clampedDist + waveSin * 0.22 + velocityBoost * 0.35;
    rx = clamp(-cascadeWave * 26 + waveCos * 5.5, -34, 34);
    ry = clamp(colOffset * absDist * 16 + waveSin * 7.5, -24, 24);
    rz = clamp(clampedDist * colOffset * 2.8, -5, 5);
    tx = colOffset * absDist * 8;
    ty = clampedDist * 14 + waveSin * 4;
    tz = clamp(centerProximity * 38 - absDist * 52 + waveCos * 14, -75, 48);
    scale = clamp(1.02 - absDist * 0.055, 0.92, 1.03);
  } else if (mode === 'helix-spiral') {
    // 2. 3D Helix Spiral: Left and right cards twist in opposite directions
    // (rotateY(±32deg), rotateZ(±4deg), translateX, translateZ)
    const spiralEnvelope = clamp(
      absDist * 0.92 + 0.18 + Math.abs(velocityBoost) * 0.25,
      0.15,
      1.15
    );
    const helixTwist = sideSign * spiralEnvelope * (0.72 + 0.28 * Math.abs(colOffset));
    ry = clamp(helixTwist * 32 + waveSin * 4 * sideSign, -34, 34);
    rz = clamp(-sideSign * spiralEnvelope * 4 + waveCos * 1.2, -5.5, 5.5);
    rx = clamp(-clampedDist * 15 + waveSin * 4.5, -22, 22);
    tx = clamp(
      sideSign * spiralEnvelope * 20 * (0.6 + 0.4 * Math.sin(scrollPhase + rowIndex * 0.8)),
      -28,
      28
    );
    ty = clampedDist * 10;
    tz = clamp(centerProximity * 44 - spiralEnvelope * 58 + waveSin * 12, -80, 52);
    scale = clamp(1.025 - absDist * 0.06, 0.91, 1.03);
  } else if (mode === 'deep-zoom') {
    // 3. 3D Deep Zoom: Cards levitate and zoom up from deep 3D space (translateZ & rotateX)
    const depthCurve = Math.pow(Math.min(1.25, absDist), 1.25);
    tz = clamp(
      centerProximity * 56 - depthCurve * 112 + waveCos * 16 + Math.abs(velocityBoost) * 18,
      -125,
      64
    );
    rx = clamp(-clampedDist * 24 + waveSin * 6 + velocityBoost * 10, -32, 32);
    ry = clamp(-colOffset * clampedDist * 13 + waveCos * 4, -20, 20);
    rz = clamp(colOffset * absDist * 2.2, -4, 4);
    tx = -colOffset * depthCurve * 12;
    ty = clampedDist * 16 - centerProximity * 5;
    scale = clamp(1.04 - depthCurve * 0.11, 0.88, 1.045);
  } else if (mode === 'orbit-wave') {
    // 4. 3D Orbit Wave: Elliptical 3D orbital wave across rows and columns
    const orbitAngle = clampedDist * Math.PI * 0.85 + colIndex * 0.65 + scrollPhase * 0.6;
    const orbitSin = Math.sin(orbitAngle);
    const orbitCos = Math.cos(orbitAngle);
    rx = clamp(-orbitSin * 22 + velocityBoost * 8, -30, 30);
    ry = clamp(orbitCos * 24 * (colOffset === 0 ? sideSign : colOffset), -30, 30);
    rz = clamp(orbitSin * colOffset * 4.5, -6, 6);
    tx = clamp(orbitCos * 16 * sideSign, -24, 24);
    ty = clamp(orbitSin * 14, -20, 20);
    tz = clamp(centerProximity * 48 - absDist * 64 + orbitCos * 22, -85, 56);
    scale = clamp(1.03 - absDist * 0.065, 0.9, 1.035);
  } else {
    // 5. 3D Prism Fold: Origami prism accordion folding across alternating columns
    const colParity = colIndex % 2 === 0 ? -1 : 1;
    const foldIntensity = clamp(absDist * 0.95 + 0.12, 0.12, 1.2);
    ry = clamp(colParity * foldIntensity * 30 + waveCos * 3.5 * colParity, -35, 35);
    rx = clamp(-clampedDist * 18 + (rowIndex % 2 === 0 ? 1 : -1) * foldIntensity * 8, -28, 28);
    rz = clamp(colParity * clampedDist * 3.6, -5, 5);
    tx = clamp(-colParity * foldIntensity * 12, -20, 20);
    ty = clampedDist * 12;
    tz = clamp(centerProximity * 50 - foldIntensity * 68 + waveSin * 10, -90, 54);
    scale = clamp(1.03 - absDist * 0.07, 0.9, 1.035);
  }

  // Scroll-angle dependent holographic shimmer & center emerald spotlight glow
  const shimmerAngle = Math.round(125 + ry * 1.6 - rx * 1.3 + (scrollY % 360) * 0.25);
  const shimmerOpacity = Number(
    clamp(0.18 + (Math.abs(rx) + Math.abs(ry)) / 65 + centerProximity * 0.22, 0.16, 0.72).toFixed(3)
  );
  const spotlightOpacity = Number(clamp(Math.pow(centerProximity, 1.35) * 0.95, 0, 1).toFixed(3));

  return {
    rx: Number(rx.toFixed(2)),
    ry: Number(ry.toFixed(2)),
    rz: Number(rz.toFixed(2)),
    tx: Number(tx.toFixed(2)),
    ty: Number(ty.toFixed(2)),
    tz: Number(tz.toFixed(2)),
    scale: Number(scale.toFixed(3)),
    shimmerAngle,
    shimmerOpacity,
    spotlightOpacity,
  };
}

/**
 * Computes the final 3D card transform, including smooth blending between modes when `Auto` is active.
 */
export function computeCard3DTransform(
  selectedMode: Scroll3DMode,
  input: Omit<Card3DTransformInput, 'mode'>
): Card3DTransformValues {
  if (selectedMode !== 'auto') {
    return computeSingleModeCardTransform({ ...input, mode: selectedMode });
  }

  const { current, next, blendFactor } = resolveAuto3DAnimation(input.scrollY);
  const primary = computeSingleModeCardTransform({ ...input, mode: current });
  if (blendFactor <= 0.001) {
    return primary;
  }

  const secondary = computeSingleModeCardTransform({ ...input, mode: next });
  return {
    rx: Number(lerp(primary.rx, secondary.rx, blendFactor).toFixed(2)),
    ry: Number(lerp(primary.ry, secondary.ry, blendFactor).toFixed(2)),
    rz: Number(lerp(primary.rz, secondary.rz, blendFactor).toFixed(2)),
    tx: Number(lerp(primary.tx, secondary.tx, blendFactor).toFixed(2)),
    ty: Number(lerp(primary.ty, secondary.ty, blendFactor).toFixed(2)),
    tz: Number(lerp(primary.tz, secondary.tz, blendFactor).toFixed(2)),
    scale: Number(lerp(primary.scale, secondary.scale, blendFactor).toFixed(3)),
    shimmerAngle: Math.round(lerp(primary.shimmerAngle, secondary.shimmerAngle, blendFactor)),
    shimmerOpacity: Number(
      lerp(primary.shimmerOpacity, secondary.shimmerOpacity, blendFactor).toFixed(3)
    ),
    spotlightOpacity: Number(
      lerp(primary.spotlightOpacity, secondary.spotlightOpacity, blendFactor).toFixed(3)
    ),
  };
}
