"use client";

import { useSettings, ACCENT_SWATCHES } from "@/lib/settings-context";

export default function SettingsPopup({ isOpen, onClose }) {
  const { theme, accent, viewMode, setTheme, setAccent, setViewMode } =
    useSettings();

  if (!isOpen) return null;

  return (
    <div className={`settings-popup ${isOpen ? "is-open" : ""}`}>
      <div className="settings-popup__backdrop" onClick={onClose} />
      <div className="settings-popup__panel">
        <h3 className="settings-popup__title">Settings</h3>

        <div className="settings-group">
          <label className="settings-label">Theme</label>
          <div className="settings-options">
            {["auto", "dark", "light"].map((val) => (
              <button
                key={val}
                className={`settings-option ${theme === val ? "active" : ""}`}
                onClick={() => setTheme(val)}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-group">
          <label className="settings-label">Accent colour</label>
          <div className="settings-options settings-accent">
            {Object.entries(ACCENT_SWATCHES).map(([key, hex]) => (
              <button
                key={key}
                className={`settings-accent-btn ${accent === key ? "active" : ""}`}
                style={{ "--swatch": hex }}
                onClick={() => setAccent(key)}
              >
                <span className="settings-accent-swatch" />
                <span className="settings-accent-label">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-group">
          <label className="settings-label">View mode</label>
          <div className="settings-options">
            {["wireframe", "solid", "none"].map((val) => (
              <button
                key={val}
                className={`settings-option ${viewMode === val ? "active" : ""}`}
                onClick={() => setViewMode(val)}
              >
                {val.charAt(0).toUpperCase() + val.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
