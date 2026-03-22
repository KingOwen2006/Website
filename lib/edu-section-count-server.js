import fs from "fs";
import path from "path";

import { getSectionsFromPost } from "./edu-post-sections";

/**
 * Section count for loading skeletons (reads local data/edu-posts.json when present).
 * Server-only — do not import from client components.
 */
export function getSectionCountForSlug(slug) {
  try {
    const filePath = path.join(process.cwd(), "data", "edu-posts.json");
    if (!fs.existsSync(filePath)) return 4;
    const raw = fs.readFileSync(filePath, "utf8");
    const posts = JSON.parse(raw);
    if (!Array.isArray(posts)) return 4;
    const post = posts.find((p) => p.slug === slug);
    if (!post) return 4;
    const { sections } = getSectionsFromPost(post);
    return Math.max(1, sections.length);
  } catch {
    return 4;
  }
}
