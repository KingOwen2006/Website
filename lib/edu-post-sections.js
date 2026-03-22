import { replaceEmbeds } from "./edu-embeds";

export function parseHtmlIntoSections(html, fallbackTitleHtml) {
  const processed = replaceEmbeds(html || "");
  const trimmed = processed.trim();
  if (!trimmed) {
    return {
      sections: [
        {
          titleHtml: fallbackTitleHtml || "Content",
          bodyHtml: "",
          isFallback: true,
        },
      ],
    };
  }

  const parts = trimmed.split(/(?=<h2\b)/i);
  const sections = [];

  for (const part of parts) {
    if (!part.trim()) continue;
    const m = part.match(/^<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
    if (m) {
      const bodyHtml = part.slice(m[0].length);
      sections.push({ titleHtml: m[1], bodyHtml });
    } else {
      sections.push({
        titleHtml: "Introduction",
        bodyHtml: part,
        isPreamble: true,
      });
    }
  }

  if (sections.length === 0) {
    sections.push({
      titleHtml: fallbackTitleHtml || "Content",
      bodyHtml: trimmed,
      isFallback: true,
    });
  }

  return { sections };
}

export function getSectionsFromPost(post) {
  const raw = post?.content?.rendered || post?.content || "";
  const fallbackTitle = post?.title?.rendered || post?.title || "Content";
  return parseHtmlIntoSections(raw, fallbackTitle);
}

export function stripHtmlToExcerpt(html, maxLen = 220) {
  const plain = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen).trim()}…`;
}

export function stripTagsForTitle(html) {
  return (html || "").replace(/<[^>]+>/g, "").trim();
}
