"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";

import { replaceEmbeds } from "@/lib/edu-embeds";
import {
  enhanceImageCompare,
  getWordCount,
} from "@/components/post-content-client-utils";

export default function EduPostFullContent({ slug, titleHtml, fullHtml }) {
  const contentRef = useRef(null);
  const processed = useMemo(() => replaceEmbeds(fullHtml || ""), [fullHtml]);

  useEffect(() => {
    if (!contentRef.current) return;
    const scope = contentRef.current;

    const wordCountEl = document.querySelector("#post .word-count");
    if (wordCountEl) {
      wordCountEl.textContent = `Word count: ${getWordCount(processed)}`;
    }

    enhanceImageCompare(scope);

    scope.querySelectorAll("iframe[src*='figma.com']").forEach((old) => {
      old.replaceWith(old.cloneNode(true));
    });

    if (window.initGlbViewers) window.initGlbViewers(scope);
  }, [processed]);

  return (
    <div id="post">
      {titleHtml ? (
        <h1
          className="edu-post-full-title"
          dangerouslySetInnerHTML={{ __html: titleHtml }}
        />
      ) : null}
      <p className="word-count">Loading word count...</p>
      <div ref={contentRef} className="post-content edu-post-full">
        <div
          className="edu-post-full-body"
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      </div>
      <nav className="edu-section-nav" aria-label="Post navigation">
        <span className="edu-section-nav__spacer" aria-hidden="true" />
        <Link href={`/post/${slug}`} className="edu-section-nav__center">
          All sections
        </Link>
        <span className="edu-section-nav__spacer" aria-hidden="true" />
      </nav>
    </div>
  );
}
