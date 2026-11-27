import "./preferences";
import "./preferences.css";

export function element<T extends HTMLElement>(selector: string) {
  const result = document.querySelector<T>(selector);
  if (!result) throw new Error(`Missing page element: ${selector}`);
  return result;
}

export function icon(name: string) {
  return `<img class="ui-icon" src="/icons/${name}.svg" width="30" height="30" alt="">`;
}

const navItems = [
  { id: "home", label: "Home", icon: "home" },
  { id: "education", label: "Education", icon: "education" },
  { id: "projects", label: "Projects", icon: "apps" },
  { id: "feed", label: "Feed", icon: "cards" },
  { id: "shop", label: "Shop", icon: "shop" },
  { id: "account", label: "Account", icon: "profile" },
  { id: "settings", label: "Settings", icon: "tools" },
];

type Page = "home" | "education" | "feed" | "settings" | "shop" | "account";
const railHandoffKey = "portfolio-rail-handoff";

function takeRailHandoff(): { from: Page; expanded: boolean } | undefined {
  try {
    const stored = sessionStorage.getItem(railHandoffKey);
    sessionStorage.removeItem(railHandoffKey);
    if (!stored || URL.parse(document.referrer)?.origin !== location.origin) return;
    const { from, to, time, expanded } = JSON.parse(stored);
    if (to === location.pathname && Date.now() - time < 15000 &&
      (from === "home" || from === "education" || from === "feed" || from === "settings" || from === "shop" || from === "account")) {
      return { from, expanded: expanded === true };
    }
  } catch {
    // The navigation still works when storage is unavailable.
  }
}

function ensurePageEntrance(startSelection: () => void) {
  function enterWithoutSnapshot() {
    document.querySelector("main")?.animate([
      { opacity: .86 },
      { opacity: 1 },
    ], { duration: 220, easing: "ease-out" });
    startSelection();
  }

  function useTransition(transition?: ViewTransition | null) {
    if (transition) void transition.ready.then(startSelection, enterWithoutSnapshot);
    else enterWithoutSnapshot();
  }

  const captured = (window as Window & { portfolioPageTransition?: ViewTransition | null }).portfolioPageTransition;
  if (captured !== undefined || !("onpagereveal" in window)) {
    useTransition(captured);
    return;
  }
  window.addEventListener("pagereveal", (event) => {
    useTransition((event as Event & { viewTransition?: ViewTransition | null }).viewTransition);
  }, { once: true });
}

export function mountNavigation(page: Page) {
  window.addEventListener("pageswap", (event) => {
    // The outgoing transition's ready promise rejects when its document is hidden.
    void event.viewTransition?.ready.catch(() => {});
  });
  const rail = element(".rail");
  const toggle = element<HTMLButtonElement>(".rail-toggle");
  const navigation = element("#site-navigation");
  toggle.innerHTML = icon("drawer");
  navigation.innerHTML = '<span class="rail-selection" aria-hidden="true" hidden></span>' + navItems.map(({ id, label, icon: name }) => {
    const href = id === "education" || id === "feed" || id === "settings" || id === "shop" || id === "account" ? `/${id}/` : `${page === "home" ? "" : "/"}#${id}`;
    const current = id === page ? 'aria-current="page"' : "";
    return `${id === "settings" ? '<div class="rail-divider" aria-hidden="true"></div>' : ""}
      <a class="rail-item" data-nav-id="${id}" href="${href}" aria-label="${label}" ${current}>
        ${icon(name)}<span class="nav-label">${label}</span>
      </a>`;
  }).join("");

  const selection = element<HTMLElement>(".rail-selection");
  const current = element<HTMLAnchorElement>('.rail-item[aria-current="page"]');
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  function setExpanded(expanded: boolean) {
    rail.classList.toggle("rail-expanded", expanded);
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-label", expanded ? "Collapse navigation" : "Expand navigation");
  }

  function bounds(link: HTMLAnchorElement) {
    const item = link.getBoundingClientRect();
    const track = navigation.getBoundingClientRect();
    return { x: item.left - track.left, y: item.top - track.top, width: item.width, height: item.height };
  }

  function syncSelection() {
    const { x, y, width, height } = bounds(current);
    selection.style.width = `${width}px`;
    selection.style.height = `${height}px`;
    selection.style.translate = `${x}px ${y}px`;
    selection.hidden = !width || !height;
  }

  const handoff = takeRailHandoff();
  // Measure the rail at its carried-over width before enabling further transitions.
  if (handoff?.expanded) {
    rail.style.transition = "none";
    setExpanded(true);
  }
  syncSelection();
  rail.style.removeProperty("transition");
  const previous = handoff?.from;
  const previousLink = previous && previous !== page
    ? navigation.querySelector<HTMLAnchorElement>(`[data-nav-id="${previous}"]`) : null;
  if (previousLink && !motion.matches) {
    const from = bounds(previousLink);
    const to = bounds(current);
    const dx = from.x - to.x;
    const dy = from.y - to.y;
    const duration = Math.min(440, 300 + Math.hypot(dx, dy) * .5);
    const slide = selection.animate([
      { transform: `translate(${dx}px, ${dy}px)` },
      { transform: "translate(0px, 0px)" },
    ], { duration, easing: "cubic-bezier(.4, 0, .2, 1)" });
    // Hold the old position until the new page and its transition can be painted.
    slide.pause();
    slide.currentTime = 0;
    ensurePageEntrance(() => {
      if (slide.playState !== "idle") slide.play();
    });
  }
  new ResizeObserver(syncSelection).observe(navigation);
  motion.addEventListener("change", () => selection.getAnimations().forEach((animation) => animation.cancel()));

  toggle.addEventListener("click", () => setExpanded(!rail.classList.contains("rail-expanded")));
  navigation.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey ||
      event.shiftKey || !(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a");
    if (!link) return;
    if (link.pathname === location.pathname) {
      if (motion.matches) return;
      link.querySelector(".ui-icon")?.animate([
        { transform: "scale(.88)" },
        { transform: "scale(1.13)", offset: .58 },
        { transform: "none" },
      ], { duration: 280, easing: "ease-out" });
      return;
    }
    try {
      sessionStorage.setItem(railHandoffKey, JSON.stringify({
        from: page,
        to: link.pathname,
        time: Date.now(),
        expanded: rail.classList.contains("rail-expanded"),
      }));
    } catch {
      // Follow the link normally even when the animation state cannot be shared.
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Node && !rail.contains(event.target)) setExpanded(false);
  });
  document.addEventListener("dragstart", (event) => {
    if (event.target instanceof Element && event.target.matches("img, a:has(img)")) event.preventDefault();
  });
  rail.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && rail.classList.contains("rail-expanded")) {
      setExpanded(false);
      toggle.focus();
    }
  });
}
