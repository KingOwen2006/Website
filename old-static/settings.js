/* ======================
   SETTINGS POPUP & PERSISTENCE
   ====================== */
(function () {
  const root = document.documentElement;
  const popup = document.getElementById("settings-popup");
  const settingsBtn = document.getElementById("nav-settings");
  const backdrop = document.getElementById("settings-backdrop");

  const ACCENT_SWATCHES = {
    blue: "#4285F4",
    coral: "#F47C6F",
    mint: "#3BCABF",
    lilac: "#8C78D9",
    mono: "#808080"
  };

  const HUE_OFFSET_2 = 40;
  const HUE_OFFSET_3 = 80;

  function hexToHsl(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) h = s = 0;
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        default: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
    const r = Math.round(f(0) * 255), g = Math.round(f(8) * 255), b = Math.round(f(4) * 255);
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
  }

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
    const hex = ACCENT_SWATCHES[val] || ACCENT_SWATCHES.mint;
    const { h, s, l } = hexToHsl(hex);
    root.style.setProperty("--accent", hex);
    if (s < 5) {
      root.style.setProperty("--accent2", hslToHex(0, 0, Math.min(100, l + 12)));
      root.style.setProperty("--accent3", hslToHex(0, 0, Math.max(0, l - 12)));
    } else {
      root.style.setProperty("--accent2", hslToHex((h + HUE_OFFSET_2) % 360, s, l));
      root.style.setProperty("--accent3", hslToHex((h + HUE_OFFSET_3) % 360, s, l));
    }
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
    applyAccent(getStored("accent", "mint"));
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
    const accentVal = getStored("accent", "mint");
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
