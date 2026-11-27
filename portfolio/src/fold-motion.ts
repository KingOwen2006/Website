type Axis = "vertical" | "horizontal";
type Direction = "fold" | "unfold";
type Posture = EventTarget & { readonly type: "folded" | "continuous" };
type Hinge = { axis: Axis; position: number };
type Display = {
  screenWidth: number;
  screenHeight: number;
  width: number;
  height: number;
  folded: boolean;
  hinge?: Hinge;
};

const handoffKey = "portfolio-fold-display";
const handoffLifetime = 30_000;
const centerHinge: Hinge = { axis: "vertical", position: 50 };

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
  if (screenRotated) return false;
  return main.width - cover.width >= 120 && main.width >= cover.width * 1.28 &&
    cover.width / cover.height <= .82 && main.width / main.height >= .72 &&
    Math.min(cover.height, main.height) >= Math.max(cover.height, main.height) * .72;
}

function readHandoff(page: string): Display | undefined {
  try {
    const stored = sessionStorage.getItem(handoffKey);
    if (stored) {
      const { display, url, time } = JSON.parse(stored);
      if (url === page && Date.now() - time < handoffLifetime) return display;
    }
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
  const diagnostic = new URLSearchParams(location.search).has("fold-test") ? document.createElement("pre") : undefined;
  if (diagnostic) {
    diagnostic.className = "fold-motion-diagnostic";
    document.body.append(diagnostic);
  }
  let timeout: number | undefined;
  let active: { overlay: HTMLElement; animations: Animation[] } | undefined;

  function readDisplay(): Display {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const [first, next] = viewport?.segments ?? [];
    const axis = columns.matches || (first && next && first.x !== next.x) ? "vertical"
      : rows.matches || (first && next && first.y !== next.y) ? "horizontal" : undefined;
    let position = 50;
    if (first && next) {
      if (axis === "vertical") position = (first.right + next.left) / (2 * width) * 100;
      if (axis === "horizontal") position = (first.bottom + next.top) / (2 * height) * 100;
    }
    return {
      width,
      height,
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
  }

  function animateFold(direction: Direction, hinge: Hinge) {
    clearAnimation();
    const opening = direction === "unfold";
    const overlay = document.createElement("div");
    overlay.className = "fold-motion";
    overlay.dataset.axis = hinge.axis;
    overlay.style.setProperty("--fold-line", `${hinge.position}%`);
    overlay.setAttribute("aria-hidden", "true");

    const first = document.createElement("div");
    const second = document.createElement("div");
    first.className = second.className = "fold-motion-panel";
    overlay.append(first, second);
    document.body.append(overlay);

    const timing: KeyframeAnimationOptions = { duration: opening ? 620 : 520, easing: "cubic-bezier(.22,.68,.28,1)", fill: "both" };
    const veil = overlay.animate(opening
      ? [{ opacity: .92 }, { opacity: .45, offset: .44 }, { opacity: 0 }]
      : [{ opacity: 0 }, { opacity: .88, offset: .5 }, { opacity: 0 }], timing);

    const rotation = hinge.axis === "vertical" ? "rotateY" : "rotateX";
    const panels = [first, second].map((panel, index) => {
      const bend = `${rotation}(${index ? -28 : 28}deg)`;
      return panel.animate(opening
        ? [{ transform: bend }, { transform: "none" }]
        : [{ transform: "none" }, { transform: bend }], timing);
    });
    active = { overlay, animations: [veil, ...panels] };
    void veil.finished.then(() => {
      if (active?.overlay === overlay) clearAnimation();
    }, () => {});
  }

  let previous = (hasTouch && readHandoff(page)) || readDisplay();
  let hiddenAt: number | undefined;
  let lastDetection = "Waiting for a fold or unfold";

  function saveDisplay() {
    if (!hasTouch) return;
    try {
      sessionStorage.setItem(handoffKey, JSON.stringify({ url: page, display: previous, time: Date.now() }));
    } catch {
      // A blocked storage setting still permits live detection.
    }
  }

  function updateDiagnostic() {
    if (!diagnostic) return;
    diagnostic.textContent = [
      `Screen ${previous.screenWidth}×${previous.screenHeight} · Viewport ${previous.width}×${previous.height}`,
      `Posture ${posture?.type ?? (previous.folded ? "folded (CSS)" : "unreported")} · Hinge ${previous.hinge?.axis ?? "unreported"}`,
      `Reduced motion ${motion.matches ? "on" : "off"} · ${lastDetection}`,
    ].join("\n");
  }

  function refresh() {
    timeout = undefined;
    if (document.hidden) return;
    const before = previous;
    const after = readDisplay();
    previous = after;
    saveDisplay();

    const signals = [
      { name: "screen size", opens: hasTouch && screenOpens(before, after), closes: hasTouch && screenOpens(after, before) },
      { name: "posture", opens: before.folded && !after.folded, closes: !before.folded && after.folded },
      { name: "viewport segments", opens: !before.hinge && after.hinge, closes: before.hinge && !after.hinge },
      { name: "viewport size", opens: hasTouch && viewportOpens(before, after), closes: hasTouch && viewportOpens(after, before) },
    ];
    const signal = signals.find(({ opens, closes }) => opens || closes);
    if (signal) {
      const direction = signal.opens ? "unfold" : "fold";
      lastDetection = `Detected ${direction} via ${signal.name}`;
      if (!motion.matches) animateFold(direction, after.hinge ?? before.hinge ?? centerHinge);
    }
    updateDiagnostic();
  }

  function schedule() {
    if (timeout !== undefined) window.clearTimeout(timeout);
    timeout = window.setTimeout(refresh, 90);
  }

  for (const signal of [folded, columns, rows, posture]) signal?.addEventListener("change", schedule);
  window.addEventListener("resize", schedule, { passive: true });
  window.visualViewport?.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("focus", schedule);
  screen.orientation?.addEventListener("change", schedule);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      saveDisplay();
      clearAnimation();
      return;
    }
    if (hiddenAt !== undefined && Date.now() - hiddenAt >= handoffLifetime) previous = readDisplay();
    hiddenAt = undefined;
    schedule();
  });
  motion.addEventListener("change", () => {
    if (motion.matches) clearAnimation();
    updateDiagnostic();
  });
  window.addEventListener("pagehide", () => {
    saveDisplay();
    clearAnimation();
  });
  window.addEventListener("pageshow", schedule);
  updateDiagnostic();
  schedule();
}
