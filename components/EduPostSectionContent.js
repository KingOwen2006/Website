"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";

import { replaceEmbeds } from "@/lib/edu-embeds";
import {
  enhanceImageCompare,
  getWordCount,
} from "@/components/post-content-client-utils";

export default function EduPostSectionContent({
  slug,
  sectionSlug,
  prevSlug,
  nextSlug,
  titleHtml,
  bodyHtml,
}) {
  const contentRef = useRef(null);
  const processedBody = useMemo(
    () => replaceEmbeds(bodyHtml || ""),
    [bodyHtml],
  );
  const htmlForCount = useMemo(
    () => `<div>${titleHtml}</div>${processedBody}`,
    [titleHtml, processedBody],
  );

  useEffect(() => {
    if (!contentRef.current) return;
    const scope = contentRef.current;

    const wordCountEl = document.querySelector("#post .word-count");
    if (wordCountEl) {
      wordCountEl.textContent = `Word count: ${getWordCount(htmlForCount)}`;
    }

    enhanceImageCompare(scope);

    scope.querySelectorAll("iframe[src*='figma.com']").forEach((old) => {
      old.replaceWith(old.cloneNode(true));
    });

    if (window.initGlbViewers) window.initGlbViewers(scope);
  }, [htmlForCount, processedBody]);

  return (
    <div id="post">
      <p className="word-count">Loading word count...</p>
      <div ref={contentRef} className="post-content">
        <h2
          className="edu-post-section-heading"
          dangerouslySetInnerHTML={{ __html: titleHtml }}
        />
        <div
          className="edu-post-section-body"
          dangerouslySetInnerHTML={{ __html: processedBody }}
        />
      </div>
      <nav className="edu-section-nav" aria-label="Section navigation">
        {prevSlug ? (
          <Link
            href={`/post/${slug}/${prevSlug}`}
            className="edu-section-nav__link edu-section-nav__link--prev"
          >
            ← Back
          </Link>
        ) : (
          <span className="edu-section-nav__spacer" aria-hidden="true" />
        )}
        <Link href={`/post/${slug}`} className="edu-section-nav__center">
          All sections
        </Link>
        {nextSlug ? (
          <Link
            href={`/post/${slug}/${nextSlug}`}
            className="edu-section-nav__link edu-section-nav__link--next"
          >
            Next →
          </Link>
        ) : (
          <span className="edu-section-nav__spacer" aria-hidden="true" />
        )}
      </nav>
      <div className="edu-read-in-full-footer">
        <Link href={`/post/${slug}/full`} className="edu-read-in-full-link">
          Read in full
        </Link>
      </div>
    </div>
  );
}
