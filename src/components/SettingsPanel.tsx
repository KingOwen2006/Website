export default function SettingsPanel() {
  return (
    <section className="settings-panel" aria-label="Settings">
      <header className="settings-header">
        <h2 className="settings-title">Settings</h2>
        <p className="settings-lead">Site preferences and controls.</p>
      </header>

      <div className="settings-section">
        <h3 className="settings-section-title">Appearance</h3>
        <p className="settings-section-desc">The site currently uses its default appearance.</p>
      </div>
    </section>
  )
}
