const handle = "KingOwenFYI";
const accountId = "1977344238292455425";
const pageSize = 12;
// FxTwitter currently resolves this account by its numeric ID.
const profileUrl = `https://api.fxtwitter.com/2/profile/id:${accountId}`;
const timelineUrl = `${profileUrl}/statuses`;
const countFormat = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 });
const timelineCacheKey = `portfolio-feed:${accountId}:v1`;
const timelineCacheMaxAge = 2 * 60 * 1000;

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : undefined;
}

type PostPhoto = { url: string; alt: string; width: number; height: number };
export type FeedPost = {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  date: number;
  likes?: number;
  replies?: number;
  reposts?: number;
  views?: number;
  photo?: PostPhoto;
};

function count(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function parsePost(value: unknown): FeedPost | undefined {
  const post = record(value);
  if (!post || typeof post.id !== "string" || !/^\d{1,20}$/.test(post.id)) return;
  if (post.replying_to || post.reposted_by || post.quote) return;
  const author = record(post.author);
  if (typeof author?.screen_name !== "string" || author.screen_name.toLowerCase() !== handle.toLowerCase()) return;
  const media = record(post.media);
  const photo = Array.isArray(media?.photos) ? record(media.photos[0]) : undefined;
  const video = Array.isArray(media?.videos) ? record(media.videos[0]) : undefined;
  const imageUrl = photo?.url ?? video?.thumbnail_url;
  return {
    id: post.id,
    author: typeof author.name === "string" && author.name.trim() ? author.name : `@${handle}`,
    avatar: typeof author.avatar_url === "string" && author.avatar_url.startsWith("https://pbs.twimg.com/profile_images/")
      ? author.avatar_url : undefined,
    text: typeof post.text === "string" ? post.text.trim() : "",
    date: typeof post.created_timestamp === "number" ? post.created_timestamp * 1000
      : typeof post.created_at === "string" ? Date.parse(post.created_at) : NaN,
    likes: count(post.likes),
    replies: count(post.replies),
    reposts: count(post.reposts),
    views: count(post.views),
    photo: typeof imageUrl === "string" && imageUrl.startsWith("https://pbs.twimg.com/")
      ? {
        url: imageUrl,
        alt: typeof photo?.altText === "string" ? photo.altText : "",
        width: count(photo?.width ?? video?.width) || 800,
        height: count(photo?.height ?? video?.height) || 450,
      } : undefined,
  };
}

export async function fetchFollowerCount() {
  const response = await fetch(profileUrl, { credentials: "omit", cache: "no-cache", signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`FxTwitter returned ${response.status}`);
  const profile = record(record(await response.json())?.user);
  return count(profile?.followers);
}

function parseFeedPage(value: unknown) {
  const data = record(value);
  if (!Array.isArray(data?.results)) throw new Error("Invalid FxTwitter timeline");
  const posts = data.results.map(parsePost).filter((post): post is FeedPost => post !== undefined);
  const next = record(data.cursor)?.bottom;
  // An empty upstream page ends the timeline even if FxTwitter includes a cursor.
  return { posts, cursor: data.results.length && typeof next === "string" && next ? next : undefined };
}

export type FeedPage = ReturnType<typeof parseFeedPage>;

export function readCachedFeedPage() {
  try {
    const snapshot = record(JSON.parse(sessionStorage.getItem(timelineCacheKey) ?? "null"));
    if (typeof snapshot?.savedAt !== "number") return;
    const page = parseFeedPage(snapshot.timeline);
    if (page.posts.length) {
      return { page, fresh: Date.now() - snapshot.savedAt < timelineCacheMaxAge };
    }
  } catch {
    // The network can still supply the feed if browser storage is unavailable.
  }
}

export async function fetchFeedPage(cursor?: string): Promise<FeedPage> {
  const url = new URL(timelineUrl);
  url.searchParams.set("count", cursor ? "100" : "40");
  if (cursor) url.searchParams.set("cursor", cursor);
  const response = await fetch(url, { credentials: "omit", signal: AbortSignal.timeout(10000) });
  const empty = response.status === 404 || response.status === 204;
  if (!empty && !response.ok) throw new Error(`FxTwitter returned ${response.status}`);
  const timeline: unknown = empty ? { results: [] } : await response.json();
  const page = parseFeedPage(timeline);
  if (!cursor) {
    try {
      if (page.posts.length) sessionStorage.setItem(timelineCacheKey, JSON.stringify({ savedAt: Date.now(), timeline }));
      else sessionStorage.removeItem(timelineCacheKey);
    } catch {
      // The loaded posts are still usable if the browser cannot store them.
    }
  }
  return page;
}

export function makePost(post: FeedPost, full = false) {
  const card = document.createElement("article");
  card.className = full ? "card feed-card feed-timeline-post" : "card feed-card";
  card.dataset.postId = post.id;
  const author = full
    ? `<div class="feed-timeline-avatar" aria-hidden="true"></div>
       <header class="feed-timeline-author"><h2></h2><span>@${handle}</span></header>`
    : "";
  card.innerHTML = `${author}<div class="feed-card-body">
    ${full ? "" : "<h3></h3>"}<p class="feed-post-text"></p>
  </div><div class="feed-card-stats" role="group" aria-label="Post engagement"></div>
  <div class="feed-card-footer">
    <a class="card-action" target="_blank" rel="noopener noreferrer">${full ? "View on X" : "Open post"}</a>
  </div>`;
  card.querySelector("h2, h3")!.textContent = post.author;
  if (full) {
    const avatar = card.querySelector<HTMLElement>(".feed-timeline-avatar")!;
    avatar.textContent = post.author.charAt(0).toUpperCase();
    if (post.avatar) {
      const image = document.createElement("img");
      image.src = post.avatar;
      image.alt = "";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      avatar.append(image);
    }
  }
  const body = card.querySelector<HTMLElement>(".feed-card-body")!;
  const summary = body.querySelector("p")!;
  summary.textContent = post.text;
  if (post.photo) {
    const image = document.createElement("img");
    image.className = "feed-post-photo";
    image.src = post.photo.url;
    image.alt = post.photo.alt;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.width = post.photo.width;
    image.height = post.photo.height;
    const frame = document.createElement("div");
    frame.className = "feed-photo-frame";
    frame.append(image);
    body.append(frame);
    card.classList.add("feed-card-with-photo");
  }
  if (!summary.textContent && !post.photo) summary.textContent = "View this post on X.";

  const stats = card.querySelector(".feed-card-stats")!;
  const metrics = [["comments", post.replies], ["reposts", post.reposts], ["likes", post.likes], ["views", post.views]] as const;
  for (const [label, value] of metrics) {
    const metric = document.createElement("span");
    metric.className = "feed-metric";
    metric.title = value === undefined ? `${label[0].toUpperCase()}${label.slice(1)} unavailable`
      : `${value.toLocaleString("en-GB")} ${value === 1 ? label.slice(0, -1) : label}`;
    metric.innerHTML = `<img src="/icons/feed-${label}.svg" alt="" width="18" height="18"><span aria-hidden="true"></span><span class="feed-metric-label"></span>`;
    metric.querySelector('[aria-hidden]')!.textContent = value === undefined ? "—" : countFormat.format(value);
    metric.querySelector(".feed-metric-label")!.textContent = metric.title;
    stats.append(metric);
  }

  card.querySelector("a")!.href = `https://${full ? "x.com" : "fxtwitter.com"}/${handle}/status/${post.id}`;
  return card;
}

export async function loadFeed(track: HTMLElement, status: HTMLElement, refresh: () => void) {
  try {
    const cached = readCachedFeedPage();
    const { posts } = cached?.fresh ? cached.page : await fetchFeedPage().catch((error: unknown) => {
      if (cached) return cached.page;
      throw error;
    });
    const unique = [...new Map(posts.map((post) => [post.id, post])).values()].slice(0, pageSize);
    if (!unique.length) {
      status.textContent = "FxTwitter has no posts available for this account.";
      return;
    }
    track.replaceChildren(...unique.map((post) => makePost(post)));
    track.hidden = false;
    status.hidden = true;
    refresh();
  } catch {
    status.textContent = "The feed is temporarily unavailable.";
  }
}
