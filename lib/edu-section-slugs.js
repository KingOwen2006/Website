/**
 * URL-safe slugs for post sections. Reserved: "full" (read-in-full route).
 */
const RESERVED = new Set(["full"]);

export function slugifySectionTitle(html) {
  const plain = (html || "").replace(/<[^>]+>/g, "").trim();
  const base = plain
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!base) return "section";
  if (RESERVED.has(base)) return `${base}-section`;
  return base;
}

export function assignSectionSlugs(sections) {
  const used = new Set();
  return sections.map((s) => {
    let base = slugifySectionTitle(s.titleHtml);
    let slug = base;
    let n = 2;
    while (used.has(slug)) {
      slug = `${base}-${n}`;
      n++;
    }
    used.add(slug);
    return { ...s, slug };
  });
}
