import { useState } from 'react'
import {
  CATEGORY_LABELS,
  type PortfolioCategory,
  type PortfolioItem,
} from '../data/portfolio'

type PortfolioGridProps = {
  items: PortfolioItem[]
  showFilters?: boolean
  title?: string
  limit?: number
}

const STATUS_LABELS: Record<PortfolioItem['status'], string> = {
  finished: 'Done',
  wip: 'WIP',
  personal: 'Personal',
}

export default function PortfolioGrid({
  items,
  showFilters = true,
  title,
  limit,
}: PortfolioGridProps) {
  const [category, setCategory] = useState<PortfolioCategory>('all')

  const filtered =
    category === 'all' ? items : items.filter((item) => item.category === category)
  const visible = limit ? filtered.slice(0, limit) : filtered

  const categories: PortfolioCategory[] = ['all', 'cars', 'characters', 'prints', 'games']

  return (
    <section className="portfolio-section" aria-label={title ?? 'Portfolio'}>
      {showFilters && (
        <div className="portfolio-filters" role="tablist" aria-label="Filter portfolio">
          {categories.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={category === id}
              className={`portfolio-filter${category === id ? ' portfolio-filter--active' : ''}`}
              onClick={() => setCategory(id)}
            >
              {CATEGORY_LABELS[id]}
            </button>
          ))}
        </div>
      )}

      <div className="portfolio-grid">
        {visible.map((item) => (
          <article key={item.id} className="portfolio-card">
            <div className="portfolio-card-thumb">
              <img src={item.image} alt={item.title} loading="lazy" />
              <span className={`portfolio-card-status portfolio-card-status--${item.status}`}>
                {STATUS_LABELS[item.status]}
              </span>
            </div>
            <div className="portfolio-card-body">
              <h3 className="portfolio-card-title">{item.title}</h3>
              <p className="portfolio-card-desc">{item.description}</p>
              <div className="portfolio-card-tools">
                {item.tools.map((tool) => (
                  <span key={tool} className="portfolio-tool-tag">{tool}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="portfolio-empty">Nothing here yet — check back soon.</p>
      )}
    </section>
  )
}
