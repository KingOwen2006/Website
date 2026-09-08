import { DISCORD_PROFILE_URL } from '../config/discord'

type ContactRowProps = {
  title: string
  subtitle: string
  href: string
  icon: React.ReactNode
}

function ContactChevron() {
  return (
    <svg
      className="contact-list-chevron"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ContactRow({ title, subtitle, href, icon }: ContactRowProps) {
  return (
    <a className="contact-list" href={href} target="_blank" rel="noopener noreferrer">
      <span className="contact-list-icon">{icon}</span>
      <span className="contact-list-content">
        <span className="contact-list-title">{title}</span>
        <span className="contact-list-subtitle">{subtitle}</span>
      </span>
      <ContactChevron />
    </a>
  )
}

type ContactPanelProps = {
  username: string
}

export default function ContactPanel({ username }: ContactPanelProps) {
  const twitterUrl = `https://x.com/${username}`

  return (
    <section className="contact-panel" aria-label="Contact">
      <header className="contact-header">
        <h2 className="contact-title">Contact</h2>
        <p className="contact-lead">Reach out for commissions, collabs, or just to say hi.</p>
      </header>

      <div className="contact-section">
        <div className="contact-section-header">
          <h3 className="contact-section-title">Hit me up</h3>
        </div>
        <div className="contact-list-group">
          <ContactRow
            title="Discord"
            subtitle="Best for commissions & chat"
            href={DISCORD_PROFILE_URL}
            icon={
              <img
                className="contact-list-logo contact-list-logo--blue"
                src="/img/Discord.png"
                alt=""
              />
            }
          />
          <ContactRow
            title="Twitter"
            subtitle={`@${username}`}
            href={twitterUrl}
            icon={
              <img
                className="contact-list-logo contact-list-logo--blue"
                src="/img/Twitter.png"
                alt=""
              />
            }
          />
        </div>
      </div>
    </section>
  )
}
