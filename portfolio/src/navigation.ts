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
  { id: "tools", label: "Settings", icon: "tools" },
];

export function mountNavigation(page: "home" | "education" | "feed") {
  const rail = element(".rail");
  const toggle = element<HTMLButtonElement>(".rail-toggle");
  const navigation = element("#site-navigation");
  toggle.innerHTML = icon("drawer");
  navigation.innerHTML = navItems.map(({ id, label, icon: name }) => {
    const href = id === "education" || id === "feed" ? `/${id}/` : `${page === "home" ? "" : "/"}#${id}`;
    const current = id === page ? 'aria-current="page"' : "";
    return `${id === "tools" ? '<div class="rail-divider" aria-hidden="true"></div>' : ""}
      <a class="rail-item" href="${href}" aria-label="${label}" ${current}>
        ${icon(name)}<span class="nav-label">${label}</span>
      </a>`;
  }).join("");

  function setExpanded(expanded: boolean) {
    rail.classList.toggle("rail-expanded", expanded);
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.setAttribute("aria-label", expanded ? "Collapse navigation" : "Expand navigation");
  }

  toggle.addEventListener("click", () => setExpanded(!rail.classList.contains("rail-expanded")));
  navigation.addEventListener("click", () => setExpanded(false));
  document.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Node && !rail.contains(event.target)) setExpanded(false);
  });
  rail.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && rail.classList.contains("rail-expanded")) {
      setExpanded(false);
      toggle.focus();
    }
  });
}
