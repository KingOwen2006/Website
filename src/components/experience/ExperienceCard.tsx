import { Link } from 'react-router-dom'
import type { ExperienceEntry } from '../../data/experience'

type ExperienceCardProps = {
  entry: ExperienceEntry
  logoOverride?: string
}

export default function ExperienceCard({ entry, logoOverride }: ExperienceCardProps) {
  const logo = logoOverride ?? entry.logo
  const isLink = Boolean(entry.chapterSlug || entry.href)

  const title = entry.chapterSlug ? (
    <Link to={`/experience/${entry.chapterSlug}`} className="experience-card-stretched-link">
      {entry.title}
    </Link>
  ) : entry.href ? (
    <a
      href={entry.href}
      className="experience-card-stretched-link"
      target={entry.external ? '_blank' : undefined}
      rel={entry.external ? 'noopener noreferrer' : undefined}
    >
      {entry.title}
    </a>
  ) : (
    entry.title
  )

  return (
    <article className={`experience-card${isLink ? ' experience-card-link' : ''}`}>
      <img className="experience-card-logo" src={logo} alt={entry.logoAlt} />
      <div className="experience-card-content">
        <h3 className="experience-card-title">{title}</h3>
        {entry.id === 'twidget' ? (
          <p className="experience-card-detail">
            Open-source analytics app — contributor and idea generator. Built with{' '}
            <a href="https://thatjoshguy.me/" target="_blank" rel="noopener noreferrer">
              Josh
            </a>
            .
          </p>
        ) : (
          <p className="experience-card-detail">{entry.detail}</p>
        )}
        <p className="experience-card-date">{entry.date}</p>
      </div>
    </article>
  )
}
