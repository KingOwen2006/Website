"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";

import { replaceEmbeds } from "@/lib/edu-embeds";
import { stripHtmlToExcerpt } from "@/lib/edu-post-sections";
import { getWordCount } from "@/components/post-content-client-utils";

export default function EduPostCardGrid({ post, sections }) {
  const slug = post?.slug || "";
  const processedFull = useMemo(() => {
    const raw = post?.content?.rendered || post?.content || "";
    return replaceEmbeds(raw);
  }, [post]);

  useEffect(() => {
    const wordCountEl = document.querySelector("#post .word-count");
    if (wordCountEl) {
      const count = getWordCount(processedFull);
      wordCountEl.textContent = `Word count: ${count}`;
    }
  }, [processedFull]);

  return (
    <div id="post">
      <h1>Content</h1>
      <p className="word-count">Loading word count...</p>
      <div className="edu-post-cards">
        {sections.map((section, i) => {
          const excerpt = stripHtmlToExcerpt(section.bodyHtml || "");
          return (
            <Link
              key={`${i}-${section.titleHtml?.slice(0, 20)}`}
              href={`/post/${slug}/section/${i}`}
              className="glass-card edu-post-card"
            >
              <h3 dangerouslySetInnerHTML={{ __html: section.titleHtml }} />
              <p className="edu-post-card__excerpt">{excerpt}</p>
              <span className="road-card__more">Read section →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
