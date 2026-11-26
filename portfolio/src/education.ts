import { createClient } from "@sanity/client";
import { educationQuery, educationUnitQuery } from "./education-queries";
import { escapeHTML, toHTML, type PortableTextOptions } from "@portabletext/to-html";
import { countWords, splitSections, type BodyBlock } from "./education-sections";
import { bindUnitMedia, createUnitMedia, unitEmbed } from "./education-media";
import "./education-media.css";
import { element } from "./navigation";

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID || "bxr88bn5";
const dataset = import.meta.env.VITE_SANITY_DATASET || "production";
const sameOrigin = import.meta.env.VITE_EDUCATION_SAME_ORIGIN === "true" ||
  ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

const client = createClient({
  projectId, dataset,
  apiVersion: import.meta.env.VITE_SANITY_API_VERSION || "2025-01-01",
  perspective: "published",
  useCdn: !sameOrigin,
  ...(sameOrigin ? { apiHost: `${location.origin}/api/sanity-public`, useProjectHostname: false } : {}),
});

type Unit = {
  title: string;
  slug: string;
  summary: string | null;
  publishedAt: string | null;
  gradeSlugs: string[];
  thumbnail: { url: string | null; alt: string | null } | null;
};
type Chapter = {
  title: string;
  slug: string;
  subtitle: string | null;
  summary: string | null;
  dateRange: string | null;
  units: Unit[];
};

const { imageUrl: sanityImage, figure, imageGroup, comparison } = createUnitMedia(projectId, dataset);

const components = {
  block: {
    h1: ({ children }) => `<h2>${children}</h2>`,
    h2: ({ children }) => `<h2>${children}</h2>`,
    blockquote: ({ children }) => `<blockquote>${children}</blockquote>`,
  },
  marks: {
    underline: ({ children }) => `<u>${children}</u>`,
    "strike-through": ({ children }) => `<s>${children}</s>`,
  },
  types: {
    image: ({ value }) => figure(value),
    imageRow: ({ value }) => imageGroup(value.images, "row"),
    imageGallery: ({ value }) => imageGroup(value.images, value.layout === "slider" ? "slider" : "grid", value.columns),
    imageCompare: ({ value }) => comparison(value),
    layoutRow: ({ value }) => `<div class="unit-layout-row">${value.items?.map((item: { body?: BodyBlock[] }) => `<div class="unit-layout-cell">${renderBody(item.body ?? [])}</div>`).join("") ?? ""}</div>`,
    columns: ({ value }) => `<div class="education-media-grid">${value.items?.map((item: { text?: string }) => `<p>${escapeHTML(item.text ?? "")}</p>`).join("") ?? ""}</div>`,
    codeBlock: ({ value }) => `<pre><code>${escapeHTML(typeof value.code === "string" ? value.code : "")}</code></pre>`,
    separator: () => "<hr>",
    buttonBlock: ({ value }) => externalMediaLink(value.href, value.label),
    unitEmbed: ({ value }) => unitEmbed(value),
  },
} satisfies PortableTextOptions["components"];

function externalMediaLink(href: unknown, label: unknown) {
  if (typeof href !== "string" || !/^https:\/\//i.test(href)) return "";
  const text = typeof label === "string" && label ? label : "Open embedded media";
  return `<p><a href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(text)}</a></p>`;
}

function renderBody(body: BodyBlock[]): string {
  return toHTML(body, { components, onMissingComponent: false });
}

type Entry = { unit: Unit; chapter: Chapter; href: string };
const listing = element("#education-listing");
const postList = element("#education-posts");
const listingStatus = element("#education-status");
const search = element<HTMLInputElement>("#education-search");
const grade = element<HTMLSelectElement>("#education-grade");
const articleView = element("#education-unit");
const articleTitle = element("#education-unit-title");
const articleStatus = element("#education-unit-status");
const articleBody = element("#education-unit-body");
bindUnitMedia(articleBody, element<HTMLDialogElement>("#unit-lightbox"), element<HTMLImageElement>("#unit-lightbox-image"));
const articleCourse = element("#education-unit-course");
const articleImage = element<HTMLImageElement>("#education-unit-image");
const wordCount = element("#education-word-count");
const numberFormat = new Intl.NumberFormat("en-GB");
const collegeLogo = "/assets/bpc-logo.png";
const grades = { pass: "Pass", merit: "Merit", distinction: "Distinction" } as const;
let entries: Entry[] = [];
let loaded = false;
let active: { entry: Entry; controller: AbortController; blocks?: BodyBlock[] } | undefined;
let lastPost = "";

function unitCard({ unit, href }: Entry) {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.href = href;
  link.className = "education-post";
  const thumbnail = sanityImage(unit.thumbnail?.url, 960);
  const image = document.createElement("img");
  image.src = thumbnail ?? collegeLogo;
  image.alt = "";
  image.loading = "lazy";
  if (!thumbnail) image.className = "education-post-fallback";
  link.append(image);
  const text = document.createElement("div");
  text.className = "education-post-copy";
  const title = document.createElement("h3");
  title.textContent = unit.title;
  text.append(title);
  if (unit.summary) {
    const summary = document.createElement("p");
    summary.textContent = unit.summary;
    text.append(summary);
  }
  const badges = Object.entries(grades).filter(([slug]) => unit.gradeSlugs.includes(slug));
  if (badges.length) {
    const metadata = document.createElement("div");
    metadata.className = "education-post-meta";
    for (const [slug, label] of badges) {
      const badge = document.createElement("span");
      badge.className = `education-grade education-grade-${slug}`;
      badge.textContent = label;
      metadata.append(badge);
    }
    text.append(metadata);
  }
  link.append(text);
  item.append(link);
  return item;
}

function renderListing() {
  if (!loaded) return;
  const query = search.value.trim().toLowerCase();
  const visible = entries.filter(({ chapter, unit }) =>
    (!grade.value || unit.gradeSlugs.includes(grade.value)) &&
    (!query || [unit.title, unit.summary, chapter.subtitle].some((value) => value?.toLowerCase().includes(query))));
  const groups = new Map<Chapter, Entry[]>();
  for (const entry of visible) {
    const group = groups.get(entry.chapter);
    if (group) group.push(entry);
    else groups.set(entry.chapter, [entry]);
  }
  const ordered = [...groups].sort(([a], [b]) => chapterYear(a).number - chapterYear(b).number);
  postList.replaceChildren(...ordered.map(([chapter, posts]) => {
    const section = document.createElement("section");
    section.className = "education-post-group";
    const heading = document.createElement("h2");
    heading.id = `course-${chapter.slug}`;
    heading.textContent = chapterYear(chapter).label;
    section.setAttribute("aria-labelledby", heading.id);
    const list = document.createElement("ul");
    list.className = "education-posts";
    list.append(...posts.map(unitCard));
    section.append(heading, list);
    return section;
  }));
  listingStatus.textContent = visible.length ? "" : entries.length ? "No posts match your filters." : "There are no published education posts yet.";
}

function chapterYear(chapter: Chapter) {
  const match = chapter.subtitle?.match(/\byear\s+(\d+)\b/i) ?? chapter.slug.match(/\byear-(\d+)\b/i);
  return { label: match ? `Year ${match[1]}` : chapter.title, number: match ? Number(match[1]) : Infinity };
}

search.addEventListener("input", renderListing);
grade.addEventListener("change", renderListing);

function action(label: string, href: string) {
  const link = document.createElement("a");
  link.className = "education-article-action";
  link.textContent = label;
  link.href = href;
  return link;
}

function renderArticle(blocks: BodyBlock[], href: string, section: string | undefined) {
  const sections = splitSections(blocks);
  const selected = sections.findIndex(({ slug }) => slug === section);
  articleBody.replaceChildren();
  wordCount.hidden = !blocks.length;
  articleStatus.textContent = blocks.length ? "" : "No article content is available for this post.";
  if (!blocks.length) return;

  const activeSection = sections[selected];
  const body = activeSection?.blocks ?? blocks;
  wordCount.textContent = `${numberFormat.format(countWords(body, Boolean(activeSection)))} words`;
  if (sections.length && !section) {
    const grid = document.createElement("div");
    grid.className = "education-section-grid";
    for (const item of sections) {
      const link = document.createElement("a");
      link.className = "education-section-card";
      link.href = `${href}/${item.slug}`;
      const title = document.createElement("h2");
      title.textContent = item.title;
      link.append(title);
      if (item.excerpt) {
        const excerpt = document.createElement("p");
        excerpt.textContent = item.excerpt;
        link.append(excerpt);
      }
      grid.append(link);
    }
    const readAll = document.createElement("div");
    readAll.className = "education-read-all";
    readAll.append(action("Read all", `${href}/full`));
    articleBody.append(grid, readAll);
    return;
  }

  if (!section || section === "full" || activeSection) {
    articleBody.innerHTML = renderBody(body);
  } else {
    articleStatus.textContent = "That section isn’t in this post.";
  }
  if (sections.length) {
    const controls = document.createElement("nav");
    controls.className = "education-section-nav";
    controls.setAttribute("aria-label", "Post sections");
    if (selected > 0) controls.append(action("Previous section", `${href}/${sections[selected - 1].slug}`));
    controls.append(action("All sections", href));
    if (activeSection && sections[selected + 1]) controls.append(action("Next section", `${href}/${sections[selected + 1].slug}`));
    articleBody.append(controls);
  }
}

async function syncRoute() {
  if (!loaded) return;
  const [kind, chapter, unit, section] = location.hash.slice(1).split("/");
  const href = `#post/${chapter}/${unit}`;
  const entry = kind === "post" ? entries.find((item) => item.href === href) : undefined;
  if (!entry) {
    active?.controller.abort();
    active = undefined;
    articleView.hidden = true;
    listing.hidden = false;
    renderListing();
    if (kind === "post") listingStatus.textContent = "That education post isn’t available.";
    else if (lastPost) [...postList.querySelectorAll("a")].find((link) => link.hash === lastPost)?.focus();
    return;
  }

  lastPost = href;
  if (active?.entry === entry) {
    if (active.blocks) {
      renderArticle(active.blocks, href, section);
      articleTitle.focus();
    }
    return;
  }
  active?.controller.abort();
  const controller = new AbortController();
  const request: NonNullable<typeof active> = { entry, controller };
  active = request;
  listing.hidden = true;
  articleView.hidden = false;
  articleTitle.textContent = entry.unit.title;
  articleCourse.textContent = entry.chapter.subtitle ?? entry.chapter.title;
  const image = sanityImage(entry.unit.thumbnail?.url, 260);
  articleImage.hidden = false;
  articleImage.src = image ?? collegeLogo;
  articleImage.alt = image ? entry.unit.thumbnail?.alt ?? "" : "";
  articleStatus.textContent = "Loading post…";
  articleBody.replaceChildren();
  wordCount.hidden = true;
  articleTitle.focus();
  try {
    const result = await client.fetch<{ body: BodyBlock[] | null } | null>(
      educationUnitQuery, { chapterSlug: entry.chapter.slug, unitSlug: entry.unit.slug },
      { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]) },
    );
    if (active !== request || controller.signal.aborted) return;
    request.blocks = result?.body ?? [];
    renderArticle(request.blocks, href, location.hash.split("/")[3]);
  } catch {
    if (active === request && !controller.signal.aborted) articleStatus.textContent = "Couldn’t load this post. Go back and open it again.";
  }
}

window.addEventListener("hashchange", () => void syncRoute());

export async function loadEducation() {
  listingStatus.textContent = "Loading education posts…";
  try {
    const chapters = await client.fetch<Chapter[]>(educationQuery, {}, { signal: AbortSignal.timeout(10000) });
    entries = chapters.flatMap((chapter) => chapter.units.map((unit) => ({
      unit, chapter, href: `#post/${encodeURIComponent(chapter.slug)}/${encodeURIComponent(unit.slug)}`,
    })));
    entries.sort((a, b) => (Date.parse(b.unit.publishedAt ?? "") || 0) - (Date.parse(a.unit.publishedAt ?? "") || 0));
    loaded = true;
    await syncRoute();
  } catch {
    listingStatus.textContent = "Couldn’t load education posts. Reload the page to try again.";
  }
}
