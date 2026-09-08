import { SPECIALTIES, SOFTWARE } from '../data/portfolio'

export function SpecialtyBar() {
  return (
    <section className="specialty-section" aria-label="Specialties">
      <div className="specialty-grid">
        {SPECIALTIES.map((item) => (
          <div key={item.label} className="specialty-card">
            <span className="specialty-icon" aria-hidden="true">{item.icon}</span>
            <span className="specialty-label">{item.label}</span>
            <span className="specialty-desc">{item.description}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export function SoftwareBar() {
  return (
    <section className="software-section" aria-label="Software">
      <div className="software-bar">
        {SOFTWARE.map((tool) => (
          <div key={tool.name} className="software-chip">
            <img src={tool.image} alt="" className="software-chip-icon" />
            <span>{tool.name}</span>
          </div>
        ))}
        <span className="software-chip software-chip--text">3D Printing</span>
      </div>
    </section>
  )
}

export function CommissionsPanel() {
  return (
    <section className="commissions-section" aria-label="Commissions">
      <div className="commissions-inner">
        <h3 className="commissions-title">Open for projects</h3>
        <p className="commissions-desc">
          Interested in a custom car, character, or print-ready model? Get in touch on Discord and
          we can talk through your idea, timeline, and scope.
        </p>
        <div className="commissions-tags">
          <span className="commissions-tag">Vehicles</span>
          <span className="commissions-tag">Characters</span>
          <span className="commissions-tag">Print files</span>
          <span className="commissions-tag">Game assets</span>
        </div>
      </div>
    </section>
  )
}
