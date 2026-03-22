import { getSectionCountForSlug } from "@/lib/edu-section-count-server";

export default function PostPageSkeleton({ slug }) {
  const n = getSectionCountForSlug(slug);
  return (
    <div id="post">
      <div className="edu-post-skeleton-title" aria-hidden="true" />
      <div className="edu-post-skeleton-meta" aria-hidden="true" />
      <div className="edu-post-cards">
        {Array.from({ length: n }, (_, i) => (
          <div
            key={i}
            className="glass-card edu-post-card edu-post-card--ghost"
          >
            <div className="edu-post-card__ghost-title" />
            <div className="edu-post-card__ghost-line" />
            <div className="edu-post-card__ghost-line edu-post-card__ghost-line--short" />
            <div className="edu-post-card__ghost-line edu-post-card__ghost-line--med" />
            <div className="edu-post-card__ghost-more" />
          </div>
        ))}
      </div>
    </div>
  );
}
