import { readFile } from "node:fs/promises";
import path from "node:path";

const WP_API_BASE = "https://public-api.wordpress.com/wp/v2/sites/kingowenfyi.wordpress.com";
const FALLBACK_IMAGE =
  "https://cdn.discordapp.com/banners/798619259206500365/a_8024fe54d79beba91a354baedfbe65af.gif?size=600";

function stripHtml(html = "") {
  return String(html).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function escapeAttr(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function replaceMetaTag(html, { attrName, attrValue, content }) {
  const safeContent = escapeAttr(content);
  const re = new RegExp(
    `<meta\\s+${attrName}="${attrValue}"\\s+content="[^"]*"\\s*\\/?>`,
    "i"
  );
  if (re.test(html)) {
    return html.replace(re, `<meta ${attrName}="${attrValue}" content="${safeContent}">`);
  }

  // If the tag isn't present, just return original HTML.
  return html;
}

function guessImageType(url) {
  const u = String(url).toLowerCase();
  if (u.includes(".gif")) return "image/gif";
  if (u.includes(".png")) return "image/png";
  if (u.includes(".webp")) return "image/webp";
  return "image/jpeg";
}

export default async function handler(req, res) {
  const templatePath = path.join(process.cwd(), "post.html");
  let html = "";
  try {
    const slugParam = req.query?.slug;
    const slug = Array.isArray(slugParam) ? slugParam.join("/") : String(slugParam || "").trim();

    // If someone hits /api/post with no slug, just serve the normal post.html
    html = await readFile(templatePath, "utf8");

    if (!slug) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      // Cache a bit on the edge, but allow quick updates
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300");
      return res.status(200).send(html);
    }

    const url = `${WP_API_BASE}/posts?slug=${encodeURIComponent(slug)}&_embed`;
    const wpRes = await fetch(url, { headers: { Accept: "application/json" } });
    const posts = wpRes.ok ? await wpRes.json() : [];
    const post = Array.isArray(posts) && posts.length ? posts[0] : null;

    const title = post?.title?.rendered ? stripHtml(post.title.rendered) : "Post - Owen";
    const descRaw = post?.excerpt?.rendered ? stripHtml(post.excerpt.rendered) : "Read this post from Owen.";
    const description = descRaw || "Read this post from Owen.";
    const featured = post?._embedded?.["wp:featuredmedia"]?.[0]?.source_url;

    const image = featured || FALLBACK_IMAGE;
    const imageType = guessImageType(image);

    const proto = (req.headers["x-forwarded-proto"] || "https").toString();
    const host = (req.headers["x-forwarded-host"] || req.headers.host || "beta.kingowen.fyi").toString();
    const canonicalUrl = `${proto}://${host}/post/${encodeURIComponent(slug)}`;

    html = replaceMetaTag(html, { attrName: "property", attrValue: "og:title", content: title });
    html = replaceMetaTag(html, { attrName: "property", attrValue: "og:description", content: description });
    html = replaceMetaTag(html, { attrName: "property", attrValue: "og:image", content: image });
    html = replaceMetaTag(html, { attrName: "property", attrValue: "og:image:type", content: imageType });
    html = replaceMetaTag(html, { attrName: "property", attrValue: "og:url", content: canonicalUrl });

    html = replaceMetaTag(html, { attrName: "name", attrValue: "twitter:title", content: title });
    html = replaceMetaTag(html, { attrName: "name", attrValue: "twitter:description", content: description });
    html = replaceMetaTag(html, { attrName: "name", attrValue: "twitter:image", content: image });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // Cache short: WordPress updates + Discord caching are both a thing.
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=600");
    return res.status(200).send(html);
  } catch (e) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    if (!html) {
      try {
        html = await readFile(templatePath, "utf8");
      } catch {
        html = "<!doctype html><title>Post</title>";
      }
    }
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    return res.status(200).send(html);
  }
}


