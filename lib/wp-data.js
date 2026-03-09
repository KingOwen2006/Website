import { WP_CONFIG } from "./wp-config";

const CFG = WP_CONFIG;

async function fetchJson(url) {
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function getLocalUrl(path) {
  if (typeof window !== "undefined") return path;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return new URL(path, base).href;
}

export async function fetchPosts(apiKey) {
  const apiUrl = CFG.apis[apiKey];
  const localPath = CFG.localData[apiKey];

  if (CFG.dataSource === "local") {
    return fetchJson(getLocalUrl(localPath));
  }
  if (CFG.dataSource === "remote") {
    return fetchJson(apiUrl + "/posts?_embed&per_page=100");
  }
  try {
    return await fetchJson(apiUrl + "/posts?_embed&per_page=100");
  } catch (err) {
    console.warn("WordPress API failed, trying local fallback:", err.message);
    return fetchJson(getLocalUrl(localPath));
  }
}

export async function fetchPostBySlug(apiKey, slug) {
  const apiUrl = CFG.apis[apiKey];
  const localPath = CFG.localData[apiKey];

  if (CFG.dataSource === "local") {
    const posts = await fetchJson(getLocalUrl(localPath));
    const found = Array.isArray(posts)
      ? posts.find((p) => p.slug === slug)
      : null;
    if (!found) throw new Error("Post not found");
    return found;
  }
  if (CFG.dataSource === "remote") {
    const res = await fetch(
      apiUrl + "/posts?slug=" + encodeURIComponent(slug) + "&_embed",
      { next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error("Post not found");
    const posts = await res.json();
    if (!posts?.length) throw new Error("Post not found");
    return posts[0];
  }
  try {
    const res = await fetch(
      apiUrl + "/posts?slug=" + encodeURIComponent(slug) + "&_embed",
      { next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error("Post not found");
    const posts = await res.json();
    if (!posts?.length) throw new Error("Post not found");
    return posts[0];
  } catch (err) {
    console.warn("WordPress API failed, trying local fallback:", err.message);
    const posts = await fetchJson(getLocalUrl(localPath));
    const found = Array.isArray(posts)
      ? posts.find((p) => p.slug === slug)
      : null;
    if (!found) throw new Error("Post not found");
    return found;
  }
}

export async function fetchModelsConfig() {
  try {
    const res = await fetch(getLocalUrl(CFG.modelsConfig));
    if (!res.ok) return { models: {} };
    return res.json();
  } catch {
    return { models: {} };
  }
}

export function sortPosts(posts) {
  return [...posts].sort((a, b) =>
    (a.title?.rendered || a.title || "").localeCompare(
      b.title?.rendered || b.title || "",
      undefined,
      { numeric: true, sensitivity: "base" }
    )
  );
}
