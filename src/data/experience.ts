export type ExperienceGroup = 'currently' | 'previously' | 'projects'

export type ExperienceEntry = {
  id: string
  group: ExperienceGroup
  title: string
  detail: string
  date: string
  logo: string
  logoAlt: string
  chapterSlug?: string
  href?: string
  external?: boolean
}

export const EXPERIENCE_ENTRIES: ExperienceEntry[] = [
  {
    id: 'bpc-year-2',
    group: 'currently',
    title: 'Bournemouth & Poole College',
    detail:
      'UAL Games Design & Development Level 3 — Year 2. 3D modelling, game art, and pipeline work.',
    date: 'Sept 2026 — Present',
    logo: '/img/BPC.png',
    logoAlt: 'Bournemouth and Poole College',
    chapterSlug: 'bpc-level-3-year-2',
  },
  {
    id: 'bpc-year-1',
    group: 'previously',
    title: 'Bournemouth & Poole College',
    detail: 'UAL Games Design & Development Level 3 — Year 1',
    date: 'September 2025 — June 2026',
    logo: '/img/BPC.png',
    logoAlt: 'Bournemouth and Poole College',
    chapterSlug: 'bpc-level-3-year-1',
  },
  {
    id: 'bpc-gateway',
    group: 'previously',
    title: 'Bournemouth & Poole College',
    detail: 'UAL Gateway to Digital Level 2',
    date: 'September 2024 — June 2025',
    logo: '/img/BPC.png',
    logoAlt: 'Bournemouth and Poole College',
  },
  {
    id: 'this-website',
    group: 'projects',
    title: 'This website',
    detail:
      'Personal 3D artist portfolio — React, TypeScript, Vite, Lanyard Discord presence, and FxTwitter feed.',
    date: 'September 2025 — Present',
    logo: '/img/Pfp.jpg',
    logoAlt: 'This website',
  },
  {
    id: 'twidget',
    group: 'projects',
    title: 'Twidget',
    detail: 'Open-source analytics app — contributor and idea generator. Built with Josh.',
    date: 'July 2026 — Present',
    logo: '/img/Twidget.png',
    logoAlt: 'Twidget',
    href: 'https://github.com/thatjoshguy67/twidget',
    external: true,
  },
]

export const EXPERIENCE_GROUP_LABELS: Record<ExperienceGroup, string> = {
  currently: 'Currently',
  previously: 'Previously',
  projects: 'Projects',
}

export const EXPERIENCE_GROUP_ORDER: ExperienceGroup[] = ['currently', 'previously', 'projects']
