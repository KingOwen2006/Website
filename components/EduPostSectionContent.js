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
  sectionIndex,
  totalSections,
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

  const prev = sectionIndex > 0 ? sectionIndex - 1 : null;
  const next =
    sectionIndex < totalSections - 1 ? sectionIndex + 1 : null;

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
        {prev !== null ? (
          <Link
            href={`/post/${slug}/section/${prev}`}
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
        {next !== null ? (
          <Link
            href={`/post/${slug}/section/${next}`}
            className="edu-section-nav__link edu-section-nav__link--next"
          >
            Next →
          </Link>
        ) : (
          <span className="edu-section-nav__spacer" aria-hidden="true" />
        )}
      </nav>
    </div>
  );
}
