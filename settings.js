/* ======================
   SETTINGS POPUP & PERSISTENCE
   ====================== */
(function () {
  const root = document.documentElement;
  const popup = document.getElementById("settings-popup");
  const settingsBtn = document.getElementById("nav-settings");
  const backdrop = document.getElementById("settings-backdrop");

  const ACCENT_PRESETS = {
    default: { accent: "#64ffda", accent2: "#48b1ff", accent3: "#a78bfa" },
    blue: { accent: "#48b1ff", accent2: "#64b5f6", accent3: "#90caf9" },
    purple: { accent: "#a78bfa", accent2: "#c4b5fd", accent3: "#ddd6fe" },
    green: { accent: "#3fb950", accent2: "#56d364", accent3: "#7ee787" },
    coral: { accent: "#ff6b6b", accent2: "#ff8787", accent3: "#ffa8a8" },
    amber: { accent: "#f59e0b", accent2: "#fbbf24", accent3: "#fcd34d" }
  };

  function getStored(key, def) {
    try {
      return localStorage.getItem("ko-settings-" + key) || def;
    } catch (_) {
      return def;
    }
  }
  function setStored(key, val) {
    try {
      localStorage.setItem("ko-settings-" + key, val);
      if (key === "theme") {
        const effective = val === "auto" ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light") : val;
        localStorage.setItem("theme", effective);
      }
    } catch (_) {}
  }

  let autoThemeListener = null;
  function applyTheme(val) {
    if (autoThemeListener) {
      autoThemeListener();
      autoThemeListener = null;
    }
    if (val === "auto") {
      const mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
      const sync = () => root.setAttribute("data-theme", mq.matches ? "dark" : "light");
      sync();
      mq.addEventListener("change", sync);
      autoThemeListener = () => mq.removeEventListener("change", sync);
    } else {
      root.setAttribute("data-theme", val);
    }
    setStored("theme", val);
  }

  function applyAccent(val) {
    const preset = ACCENT_PRESETS[val] || ACCENT_PRESETS.default;
    root.style.setProperty("--accent", preset.accent);
    root.style.setProperty("--accent2", preset.accent2);
    root.style.setProperty("--accent3", preset.accent3);
    setStored("accent", val);
  }

  function applyViewMode(val) {
    root.setAttribute("data-viewmode", val);
    setStored("viewmode", val);
    if (window.applySceneViewMode) window.applySceneViewMode(val);
  }

  function openPopup() {
    if (popup) popup.classList.add("is-open");
  }
  function closePopup() {
    if (popup) popup.classList.remove("is-open");
  }

  function init() {
    const themeVal = getStored("theme", "dark") || localStorage.getItem("theme") || "dark";
    applyTheme(themeVal);
    applyAccent(getStored("accent", "default"));
    applyViewMode(getStored("viewmode", "wireframe"));

    if (settingsBtn) settingsBtn.addEventListener("click", openPopup);
    if (backdrop) backdrop.addEventListener("click", closePopup);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && popup?.classList.contains("is-open")) closePopup(); });

    popup?.querySelectorAll(".settings-option[data-setting='theme']").forEach((btn) => {
      btn.addEventListener("click", () => {
        popup.querySelectorAll(".settings-option[data-setting='theme']").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        applyTheme(btn.dataset.value);
      });
    });

    popup?.querySelectorAll(".settings-option[data-setting='viewmode']").forEach((btn) => {
      btn.addEventListener("click", () => {
        popup.querySelectorAll(".settings-option[data-setting='viewmode']").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        applyViewMode(btn.dataset.value);
      });
    });

    popup?.querySelectorAll(".settings-accent-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        popup.querySelectorAll(".settings-accent-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        applyAccent(btn.dataset.accent);
      });
    });

    const storedTheme = getStored("theme", "dark");
    popup?.querySelectorAll(".settings-option[data-setting='theme']").forEach((b) => {
      b.classList.toggle("active", b.dataset.value === storedTheme);
    });
    const viewVal = getStored("viewmode", "wireframe");
    popup?.querySelectorAll(".settings-option[data-setting='viewmode']").forEach((b) => {
      b.classList.toggle("active", b.dataset.value === viewVal);
    });
    const accentVal = getStored("accent", "default");
    popup?.querySelectorAll(".settings-accent-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.accent === accentVal);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.koSettings = { applyTheme, applyAccent, applyViewMode };
})();
