import { makeFoldTiltControl } from "./fold-tilt";

type Axis = "vertical" | "horizontal";
type Direction = "fold" | "unfold";
type Posture = EventTarget & { readonly type: "folded" | "continuous" };
type Hinge = { axis: Axis; position: number };
type FoldSource = "screen size" | "viewport size" | "posture" | "viewport segments";
type Fold = { direction: Direction; hinge: Hinge; source: FoldSource };
type Display = {
  screenWidth: number;
  screenHeight: number;
  width: number;
  height: number;
  quarterTurn: boolean;
  folded: boolean;
  hinge?: Hinge;
};

const handoffKey = "portfolio-fold-display-v3";
const handoffLifetime = 30_000;
const signalWindow = 650;
const centerHinge: Hinge = { axis: "vertical", position: 50 };
const signalPriority: Record<FoldSource, number> = {
  "screen size": 3,
  "viewport size": 2,
  posture: 1,
  "viewport segments": 1,
};

function screenOpens(cover: Display, main: Display) {
  // Compare the short sides so rotating the same screen cannot trigger this check.
  const coverShort = Math.min(cover.screenWidth, cover.screenHeight);
  const mainShort = Math.min(main.screenWidth, main.screenHeight);
  const coverRatio = coverShort / Math.max(cover.screenWidth, cover.screenHeight);
  const mainRatio = mainShort / Math.max(main.screenWidth, main.screenHeight);
  return coverRatio <= .72 && mainRatio >= .68 && mainRatio - coverRatio >= .085 &&
    mainShort - coverShort >= 72 && mainShort >= coverShort * 1.17;
}

function viewportOpens(cover: Display, main: Display) {
  // Some browsers keep reporting the old screen dimensions after moving the tab.
  // A width jump with comparable heights excludes browser bars, keyboards and rotation.
  const screenRotated = cover.screenWidth !== main.screenWidth &&
    cover.screenWidth === main.screenHeight && cover.screenHeight === main.screenWidth;
  const fillsScreen = Math.abs(cover.screenWidth - cover.width) <= 40 || Math.abs(main.screenWidth - main.width) <= 40;
  if (screenRotated || !fillsScreen) return false;
  return main.width - cover.width >= 120 && main.width >= cover.width * 1.28 &&
    cover.width / cover.height <= .82 && main.width / main.height >= .72 &&
    Math.min(cover.height, main.height) >= Math.max(cover.height, main.height) * .72;
}

function detectFold(before: Display, after: Display, hasTouch: boolean): Fold | undefined {
  const signals: { source: FoldSource; opens: boolean; closes: boolean }[] = [
    { source: "screen size", opens: hasTouch && screenOpens(before, after), closes: hasTouch && screenOpens(after, before) },
    { source: "viewport size", opens: hasTouch && viewportOpens(before, after), closes: hasTouch && viewportOpens(after, before) },
    { source: "posture", opens: before.folded && !after.folded, closes: !before.folded && after.folded },
    { source: "viewport segments", opens: !before.hinge && !!after.hinge, closes: !!before.hinge && !after.hinge },
  ];
  const signal = signals.find(({ opens, closes }) => opens || closes);
  if (!signal) return;
  return {
    direction: signal.opens ? "unfold" : "fold",
    hinge: after.hinge ?? before.hinge ?? centerHinge,
    source: signal.source,
  };
}

function rotateAxis(axis: Axis, quarterTurn: boolean): Axis {
  if (!quarterTurn) return axis;
  return axis === "vertical" ? "horizontal" : "vertical";
}

// Compare both panels in the same orientation. The crease runs across the
// dimension which changes least when the second half becomes available.
function inferNaturalAxis(before: Display, after: Display): Axis | undefined {
  const naturalSize = (d: Display) => d.quarterTurn
    ? [d.screenHeight, d.screenWidth] : [d.screenWidth, d.screenHeight];
  const [w1, h1] = naturalSize(before);
  const [w2, h2] = naturalSize(after);
  const dw = Math.abs(w2 - w1);
  const dh = Math.abs(h2 - h1);
  function dominantChange(dx: number, dy: number): Axis | undefined {
    if (dx >= 2 * dy && dx >= 72) return "vertical";
    if (dy >= 2 * dx && dy >= 72) return "horizontal";
  }
  const aligned = dominantChange(dw, dh);
  if (aligned || before.quarterTurn === after.quarterTurn) return aligned;
  // The inner and cover panels may define their natural orientations differently.
  const visibleAxis = dominantChange(Math.abs(after.screenWidth - before.screenWidth),
    Math.abs(after.screenHeight - before.screenHeight));
  if (visibleAxis) return rotateAxis(visibleAxis, after.quarterTurn);
}

function readHandoff(page: string): { display: Display; pending?: Fold; naturalAxis?: Axis } | undefined {
  try {
    const stored = JSON.parse(sessionStorage.getItem(handoffKey) ?? "null");
    if (stored?.url === page && Date.now() - stored.time < handoffLifetime) return stored;
  } catch {
    // A blocked storage setting still permits live detection.
  }
}

export function installFoldMotion() {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const touchScreen = matchMedia("(any-pointer: coarse)");
  const folded = matchMedia("(device-posture: folded)");
  const columns = matchMedia("(horizontal-viewport-segments: 2), (horizontal-viewport-segments: 3)");
  const rows = matchMedia("(vertical-viewport-segments: 2), (vertical-viewport-segments: 3)");
  const posture = (navigator as Navigator & { devicePosture?: Posture }).devicePosture;
  const viewport = (window as Window & { viewport?: { readonly segments: readonly DOMRectReadOnly[] | null } }).viewport;
  const page = location.pathname + location.search;
  const hasTouch = navigator.maxTouchPoints > 0 || touchScreen.matches;
  let timeout: number | undefined;
  let playbackFrame = 0;
  let active: { overlay: HTMLElement; animations: Animation[] } | undefined;

  function readDisplay(): Display {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const [first, next] = viewport?.segments ?? [];
    let axis: Axis | undefined = columns.matches || (first && next && first.x !== next.x) ? "vertical"
      : rows.matches || (first && next && first.y !== next.y) ? "horizontal" : undefined;
    let position = 50;
    if (first && next) {
      if (axis === "vertical") position = (Math.min(first.right, next.right) + Math.max(first.left, next.left)) / (2 * width) * 100;
      if (axis === "horizontal") position = (Math.min(first.bottom, next.bottom) + Math.max(first.top, next.top)) / (2 * height) * 100;
    } else if (hasTouch || axis) {
      const styles = getComputedStyle(document.documentElement);
      const edge = (name: string) => parseFloat(styles.getPropertyValue(`--fold-${name}`));
      const right = edge("right-start");
      const bottom = edge("bottom-start");
      if (right > 0 && right < width) {
        axis = "vertical";
        position = (edge("left-end") + right) / (2 * width) * 100;
      } else if (bottom > 0 && bottom < height) {
        axis = "horizontal";
        position = (edge("top-end") + bottom) / (2 * height) * 100;
      }
    }
    return {
      width,
      height,
      quarterTurn: (screen.orientation?.angle ?? 0) % 180 !== 0,
      screenWidth: screen.width,
      screenHeight: screen.height,
      folded: posture?.type === "folded" || folded.matches,
      hinge: axis ? { axis, position: Math.max(10, Math.min(90, position)) } : undefined,
    };
  }

  function clearAnimation() {
    if (!active) return;
    const { overlay, animations } = active;
    active = undefined;
    animations.forEach((animation) => animation.cancel());
    overlay.remove();
    playbackStatus = "Interrupted";
  }

  function makeLayers(hinge: Hinge) {
    const overlay = document.createElement("div");
    overlay.className = "fold-motion";
    overlay.dataset.axis = hinge.axis;
    overlay.style.setProperty("--fold-line", `${hinge.position}%`);
    overlay.setAttribute("aria-hidden", "true");

    const focus = document.createElement("div");
    const cover = document.createElement("div");
    focus.className = "fold-motion-focus";
    cover.className = "fold-motion-cover";
    overlay.append(focus, cover);
    document.body.append(overlay);
    return { overlay, focus, cover };
  }

  let liveLayers: ReturnType<typeof makeLayers> | undefined;
  let liveAngle: number | undefined;
  function showAngle(angle: number | undefined) {
    if (angle === liveAngle) return;
    const wasLive = liveAngle !== undefined;
    if (angle !== undefined && liveAngle === undefined) {
      clearAnimation();
      pending = undefined;
      cancelAnimationFrame(playbackFrame);
    }
    liveAngle = angle;
    if (wasLive !== (angle !== undefined)) updateDiagnostic();
    if (angle === undefined || angle >= 178 || motion.matches || document.hidden) {
      liveLayers?.overlay.remove();
      liveLayers = undefined;
      return;
    }
    const hinge = currentHinge() ?? { axis: rotateAxis("vertical", previous.quarterTurn), position: 50 };
    liveLayers ??= makeLayers(hinge);
    const { overlay, cover, focus } = liveLayers;
    overlay.dataset.axis = hinge.axis;
    overlay.style.setProperty("--fold-line", `${hinge.position}%`);
    const bend = (180 - angle) / 180;
    const rotation = hinge.axis === "vertical" ? `rotateY(${-68 * bend}deg)` : `rotateX(${68 * bend}deg)`;
    cover.style.transform = `perspective(900px) ${rotation}`;
    cover.style.opacity = String(Math.min(1, bend * 2));
    focus.style.opacity = String(.85 * bend);
  }

  function animateFold({ direction, hinge }: Pick<Fold, "direction" | "hinge">) {
    clearAnimation();
    const opening = direction === "unfold";
    const { overlay, focus, cover } = makeLayers(hinge);

    // Keep the live page stationary. The cover pivots and the blur samples the page in place.
    const axis = hinge.axis === "vertical" ? "Y" : "X";
    const sign = hinge.axis === "vertical" ? -1 : 1;
    const pivot = (degrees: number) => `perspective(900px) rotate${axis}(${sign * degrees}deg)`;
    const timing: KeyframeAnimationOptions = { duration: opening ? 540 : 480, fill: "both" };
    const animations = [
      cover.animate(opening ? [
        { transform: pivot(68), opacity: 0 },
        { transform: pivot(55), opacity: .94, offset: .19, easing: "cubic-bezier(.18,.62,.32,1)" },
        { transform: pivot(0), opacity: 0 },
      ] : [
        { transform: pivot(0), opacity: 0, easing: "cubic-bezier(.4,0,.3,1)" },
        { transform: pivot(57), opacity: .94, offset: .7, easing: "ease-out" },
        { transform: pivot(68), opacity: 0 },
      ], timing),
      focus.animate(opening ? [
        { opacity: 0 }, { opacity: .85, offset: .19, easing: "ease-out" }, { opacity: 0 },
      ] : [
        { opacity: 0, easing: "ease-in" }, { opacity: .85, offset: .7 }, { opacity: 0 },
      ], timing),
    ];
    active = { overlay, animations };
    playbackStatus = "Playing";
    updateDiagnostic();
    void Promise.all(animations.map(animation => animation.finished)).then(() => {
      if (active?.overlay !== overlay) return;
      clearAnimation();
      playbackStatus = "Played";
      updateDiagnostic();
    }, () => {});
  }

  const handoff = hasTouch ? readHandoff(page) : undefined;
  let previous = handoff?.display ?? readDisplay();
  let naturalAxis = handoff?.naturalAxis;
  function currentHinge(): Hinge | undefined {
    return previous.hinge ?? (naturalAxis && { axis: rotateAxis(naturalAxis, previous.quarterTurn), position: 50 });
  }
  let pending = handoff?.pending;
  let hiddenAt: number | undefined;
  let lastFold = pending;
  let lastFoldAt = pending ? performance.now() : -Infinity;
  let lastDetection = pending ? `Detected ${pending.direction} before the page resumed` : "Waiting for a fold or unfold";
  let playbackStatus = "Ready";
  const diagnostic = new URLSearchParams(location.search).has("fold-test") ? makeDiagnostic() : undefined;

  function makeDiagnostic() {
    const panel = document.createElement("aside");
    panel.className = "fold-motion-diagnostic";
    const report = document.createElement("pre");
    const replay = document.createElement("button");
    replay.type = "button";
    replay.textContent = "Replay animation";
    replay.addEventListener("click", () => {
      if (!motion.matches) animateFold({ direction: lastFold?.direction ?? "unfold", hinge: currentHinge() ?? centerHinge });
    });
    const tilt = makeFoldTiltControl(showAngle);
    panel.append(report, replay, tilt.control, tilt.status);
    document.body.append(panel);
    return { report, replay, tilt };
  }

  function saveDisplay() {
    if (!hasTouch) return;
    try {
      sessionStorage.setItem(handoffKey, JSON.stringify({ url: page, display: previous, naturalAxis, pending, time: Date.now() }));
    } catch {
      // A blocked storage setting still permits live detection.
    }
  }

  function updateDiagnostic() {
    if (!diagnostic) return;
    const hinge = currentHinge();
    const axisReport = previous.hinge ? `${previous.hinge.axis} (viewport segments)`
      : hinge ? `${hinge.axis} (inferred from display switch)` : "fold or unfold once to check";
    diagnostic.report.textContent = [
      `Screen ${previous.screenWidth}×${previous.screenHeight} · Viewport ${previous.width}×${previous.height}`,
      `Posture ${posture?.type ?? (previous.folded ? "folded (CSS)" : "unreported")}`,
      `Hinge axis: ${axisReport}`,
      lastDetection,
      `Animation ${motion.matches ? "off (reduced motion)" : liveAngle !== undefined ? "following tilt" : playbackStatus.toLowerCase()}`,
    ].join("\n");
    diagnostic.replay.disabled = motion.matches || liveAngle !== undefined;
    diagnostic.tilt.control.disabled = motion.matches;
  }

  function playWhenDisplaySettles() {
    if (!pending) return;
    // Present the settled layout before playing the hinge reveal.
    playbackStatus = "Waiting for display";
    playbackFrame = requestAnimationFrame(() => {
      playbackFrame = requestAnimationFrame(playPendingFold);
    });
  }

  function playPendingFold() {
    playbackFrame = 0;
    if (document.hidden || !pending) return;
    const fold = pending;
    pending = undefined;
    saveDisplay();
    if (!motion.matches) animateFold(fold);
  }

  function queueFold(fold: Fold) {
    const now = performance.now();
    const recent = lastFold && now - lastFoldAt < signalWindow ? lastFold : undefined;
    // The screen and posture signals can arrive separately during a single switch.
    if (recent && signalPriority[fold.source] < signalPriority[recent.source]) return;
    lastFold = fold;
    lastFoldAt = now;
    lastDetection = `Detected ${fold.direction} via ${fold.source}`;
    if (!motion.matches && (pending || recent?.direction !== fold.direction)) pending = fold;
  }

  function refresh() {
    timeout = undefined;
    if (document.hidden) return;
    const before = previous;
    const after = readDisplay();
    previous = after;

    const fold = detectFold(before, after, hasTouch);
    if (fold) {
      if (fold.source === "screen size") {
        naturalAxis = inferNaturalAxis(before, after) ?? naturalAxis;
      }
      fold.hinge = after.hinge ?? before.hinge ?? currentHinge() ?? centerHinge;
      if (liveAngle !== undefined && (fold.source === "screen size" || fold.source === "viewport size")) {
        diagnostic?.tilt.stop("Display switched. Open flat to start another tilt test.");
      }
      if (liveAngle === undefined) queueFold(fold);
    }
    saveDisplay();
    playWhenDisplaySettles();
    updateDiagnostic();
  }

  function schedule() {
    if (timeout !== undefined) window.clearTimeout(timeout);
    cancelAnimationFrame(playbackFrame);
    timeout = window.setTimeout(refresh, 100);
  }

  for (const signal of [folded, columns, rows, posture]) signal?.addEventListener("change", schedule);
  window.addEventListener("resize", schedule, { passive: true });
  window.visualViewport?.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("focus", schedule);
  screen.orientation?.addEventListener("change", schedule);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      diagnostic?.tilt.stop();
      cancelAnimationFrame(playbackFrame);
      saveDisplay();
      clearAnimation();
      return;
    }
    if (hiddenAt !== undefined && Date.now() - hiddenAt >= handoffLifetime) {
      previous = readDisplay();
      pending = undefined;
    }
    hiddenAt = undefined;
    schedule();
  });
  motion.addEventListener("change", () => {
    if (motion.matches) {
      diagnostic?.tilt.stop();
      cancelAnimationFrame(playbackFrame);
      pending = undefined;
      clearAnimation();
      saveDisplay();
      playbackStatus = "Ready";
    }
    updateDiagnostic();
  });
  window.addEventListener("pagehide", () => {
    diagnostic?.tilt.stop();
    cancelAnimationFrame(playbackFrame);
    saveDisplay();
    clearAnimation();
  });
  window.addEventListener("pageshow", schedule);
  updateDiagnostic();
  schedule();
}
