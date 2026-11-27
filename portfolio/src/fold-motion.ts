type Axis = "vertical" | "horizontal";
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

function displaySwitch(before: Display, after: Display) {
  const aspect = ({ screenWidth: w, screenHeight: h }: Display) => Math.min(w, h) / Math.max(w, h);
  const previous = aspect(before);
  const current = aspect(after);
  const viewportChange = Math.max(Math.abs(after.width - before.width), Math.abs(after.height - before.height));
  // Sorting the screen dimensions makes the aspect stable during ordinary rotation.
  const shortSideChange = Math.abs(
    Math.min(after.screenWidth, after.screenHeight) - Math.min(before.screenWidth, before.screenHeight),
  );
  if (viewportChange < 120 || shortSideChange < 100) return;
  if (previous <= .63 && current >= .7) return "unfold";
  if (previous >= .7 && current <= .63) return "fold";
}

export function installFoldMotion() {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const touchScreen = matchMedia("(any-pointer: coarse)");
  const folded = matchMedia("(device-posture: folded)");
  const columns = matchMedia("(horizontal-viewport-segments: 2), (horizontal-viewport-segments: 3)");
  const rows = matchMedia("(vertical-viewport-segments: 2), (vertical-viewport-segments: 3)");
  const posture = (navigator as Navigator & { devicePosture?: Posture }).devicePosture;
  const viewport = (window as Window & { viewport?: { readonly segments: readonly DOMRectReadOnly[] | null } }).viewport;
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

  function animateFold(direction: "fold" | "unfold", hinge: Hinge) {
    clearAnimation();
    const opening = direction === "unfold";
    const overlay = document.createElement("div");
    overlay.className = "fold-motion";
    overlay.dataset.axis = hinge.axis;
    overlay.dataset.direction = direction;
    overlay.style.setProperty("--fold-line", `${hinge.position}%`);
    overlay.setAttribute("aria-hidden", "true");

    const first = document.createElement("div");
    const second = document.createElement("div");
    first.className = second.className = "fold-motion-panel";
    overlay.append(first, second);
    document.body.append(overlay);

    const timing: KeyframeAnimationOptions = { duration: opening ? 450 : 360, easing: "cubic-bezier(.22,.68,.28,1)", fill: "both" };
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

  let previous = readDisplay();
  function refresh() {
    timeout = undefined;
    if (document.hidden) return;
    const before = previous;
    previous = readDisplay();
    if (motion.matches) return;

    const detected = navigator.maxTouchPoints > 0 && touchScreen.matches ? displaySwitch(before, previous) : undefined;
    const direction = detected ?? (before.folded !== previous.folded ? (previous.folded ? "fold" : "unfold")
      : Boolean(before.hinge) !== Boolean(previous.hinge) ? (previous.hinge ? "unfold" : "fold") : undefined);
    if (direction) animateFold(direction, previous.hinge ?? before.hinge ?? { axis: "vertical", position: 50 });
  }

  function schedule() {
    if (timeout !== undefined) window.clearTimeout(timeout);
    timeout = window.setTimeout(refresh, 90);
  }

  for (const signal of [folded, columns, rows, posture]) signal?.addEventListener("change", schedule);
  window.addEventListener("resize", schedule, { passive: true });
  screen.orientation?.addEventListener("change", schedule);
  document.addEventListener("visibilitychange", schedule);
  motion.addEventListener("change", () => {
    if (motion.matches) clearAnimation();
  });
  window.addEventListener("pagehide", clearAnimation);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) previous = readDisplay();
  });
}
