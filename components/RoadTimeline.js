"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function RoadTimeline({ posts }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer =
      window._roadObserver ||
      new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) e.target.classList.add("visible");
          });
        },
        { threshold: 0.15 }
      );

    containerRef.current.querySelectorAll(".road-post").forEach((el) => {
      observer.observe(el);
    });

    return () => {
      if (containerRef.current) {
        containerRef.current.querySelectorAll(".road-post").forEach((el) => {
          observer.unobserve(el);
        });
      }
    };
  }, [posts]);

  if (!posts || posts.length === 0) {
    return (
      <div className="road-timeline" id="posts">
        <div className="road-timeline__ghost">
          {[0, 1, 2].map((k) => (
            <div key={k} className="road-post road-post--ghost visible">
              <div className="road-card road-card--ghost">
                <div className="road-card__body">
                  <div className="road-card__ghost-title" />
                  <div className="road-card__ghost-line" />
                  <div className="road-card__ghost-line road-card__ghost-line--short" />
                  <div className="road-card__ghost-more" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="road-timeline__empty">No posts found</p>
      </div>
    );
  }

  return (
    <div className="road-timeline" id="posts" ref={containerRef}>
      {posts.map((p) => {
        const img =
          p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
          p.featured_media_url;
        const excerpt = (p.excerpt?.rendered || p.excerpt || "")
          .replace(/<[^>]+>/g, "")
          .trim();
        const tags = (p._embedded?.["wp:term"]?.[1] || []).map((t) => t.name);
        const cats = (p._embedded?.["wp:term"]?.[0] || []).map((c) => c.name);
        const allTags = [...cats, ...tags];

        return (
          <div key={p.id || p.slug} className="road-post">
            <Link href={`/post/${p.slug}`} className="road-card">
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="road-card__img"
                  src={img}
                  alt={p.title?.rendered || p.title || ""}
                  loading="lazy"
                  draggable={false}
                />
              )}
              <div className="road-card__body">
                {allTags.length > 0 && (
                  <div className="road-card__tags">
                    {allTags.map((tag) => (
                      <span key={tag} className="road-card__tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div
                  className="road-card__title"
                  dangerouslySetInnerHTML={{
                    __html: p.title?.rendered || p.title || "Untitled",
                  }}
                />
                <div className="road-card__excerpt">{excerpt}</div>
                <span className="road-card__more">Read more →</span>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
