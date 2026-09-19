type MetaPillProps = {
  label: string
  value: string
  image?: string
}

export default function MetaPill({ label, value, image }: MetaPillProps) {
  return (
    <div className="home-meta-pill">
      {image ? <img className="home-meta-pill-icon" src={image} alt="" /> : null}
      <div className="home-meta-pill-copy">
        <span className="home-meta-pill-label">{label}</span>
        <strong className="home-meta-pill-value">{value}</strong>
      </div>
    </div>
  )
}
