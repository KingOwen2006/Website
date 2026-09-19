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
