export default function SectionPageSkeleton() {
  return (
    <div id="post">
      <div className="edu-post-skeleton-meta" aria-hidden="true" />
      <div className="post-content edu-post-section--ghost">
        <div className="edu-post-card__ghost-title edu-post-card__ghost-title--lg" />
        <div className="edu-post-card__ghost-line" />
        <div className="edu-post-card__ghost-line" />
        <div className="edu-post-card__ghost-line edu-post-card__ghost-line--short" />
        <div className="edu-post-card__ghost-line" />
        <div className="edu-post-card__ghost-line edu-post-card__ghost-line--med" />
      </div>
      <div className="edu-section-nav edu-section-nav--ghost">
        <div className="edu-post-card__ghost-nav" />
        <div className="edu-post-card__ghost-nav edu-post-card__ghost-nav--narrow" />
        <div className="edu-post-card__ghost-nav" />
      </div>
    </div>
  );
}
