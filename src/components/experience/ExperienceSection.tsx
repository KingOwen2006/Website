import {
  EXPERIENCE_ENTRIES,
  EXPERIENCE_GROUP_LABELS,
  EXPERIENCE_GROUP_ORDER,
} from '../../data/experience'
import ExperienceCard from './ExperienceCard'

type ExperienceSectionProps = {
  websiteLogo?: string
}

export default function ExperienceSection({ websiteLogo }: ExperienceSectionProps) {
  return (
    <section id="experience" aria-label="Experience" className="experience-section">
      {EXPERIENCE_GROUP_ORDER.map((group) => {
        const entries = EXPERIENCE_ENTRIES.filter((entry) => entry.group === group)
        if (!entries.length) return null

        return (
          <div key={group} className="experience-group">
            <h2 className="experience-group-title">{EXPERIENCE_GROUP_LABELS[group]}</h2>
            {entries.map((entry) => (
              <ExperienceCard
                key={entry.id}
                entry={entry}
                logoOverride={entry.id === 'this-website' ? websiteLogo : undefined}
              />
            ))}
          </div>
        )
      })}
    </section>
  )
}
