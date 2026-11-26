import "./styles.css";
import { fetchFeedPage, fetchFollowerCount, makePost, type FeedPost } from "./feed";
import { element, mountNavigation } from "./navigation";

mountNavigation("feed");
const list = element("#feed-list");
const status = element("#feed-page-status");
const followers = element("#feed-followers");
const retry = element<HTMLButtonElement>("#feed-retry");
const search = element<HTMLInputElement>("#feed-search");
const popover = element<HTMLDetailsElement>(".feed-filter");
const filters = element<HTMLFormElement>(".feed-filter-menu");
const posts = new Map<string, FeedPost>();
const cards = new Map<string, HTMLElement>();
const seenCursors = new Set<string>();
const followerFormat = new Intl.NumberFormat("en-GB");
const followerRefreshMs = 5 * 60 * 1000;
type Sort = "newest" | "likes" | "views" | "reposts" | "replies";
let cursor: string | undefined;
let loading = true;
let failed = false;

function date(post: FeedPost) {
  return Number.isFinite(post.date) ? post.date : 0;
}

function renderPosts() {
  const form = new FormData(filters);
  const sort = form.get("sort") as Sort;
  const query = search.value.trim().toLowerCase();
  const shown = [...posts.values()].filter((post) => !query ||
    [post.text, post.author, post.photo?.alt, "@KingOwenFYI"].some((text) => text?.toLowerCase().includes(query)));
  shown.sort((left, right) => {
    const difference = sort === "newest" ? 0 : (right[sort] ?? -1) - (left[sort] ?? -1);
    return difference || date(right) - date(left);
  });
  list.replaceChildren(...shown.map((post) => cards.get(post.id)!));
  if (failed) {
    status.textContent = posts.size ? `Showing ${shown.length} of ${posts.size} loaded posts. Older posts couldn’t be loaded.`
      : "The feed is temporarily unavailable.";
  } else if (loading) {
    status.textContent = posts.size ? `${shown.length} shown. Loading older posts…` : "Loading posts…";
  } else {
    status.textContent = shown.length ? `${shown.length} ${shown.length === 1 ? "post" : "posts"} from @KingOwenFYI`
      : posts.size ? "No posts match your search." : "FxTwitter has no posts available for this account.";
  }
}

async function loadPosts() {
  retry.hidden = true;
  failed = false;
  loading = true;
  renderPosts();
  try {
    do {
      const page = await fetchFeedPage(100, cursor);
      for (const post of page.posts) {
        if (posts.has(post.id)) continue;
        posts.set(post.id, post);
        cards.set(post.id, makePost(post, true));
      }
      if (page.cursor && seenCursors.has(page.cursor)) throw new Error("Repeated FxTwitter cursor");
      cursor = page.cursor;
      if (cursor) seenCursors.add(cursor);
      loading = Boolean(cursor);
      renderPosts();
    } while (cursor);
  } catch {
    failed = true;
    retry.hidden = false;
  } finally {
    loading = false;
    renderPosts();
  }
}

async function updateFollowers() {
  try {
    const count = await fetchFollowerCount();
    if (count === undefined) return;
    const label = ` · ${followerFormat.format(count)} ${count === 1 ? "follower" : "followers"}`;
    if (followers.textContent !== label) followers.textContent = label;
  } catch {
    // A profile outage should leave the feed and any previous count readable.
  }
}

search.addEventListener("input", renderPosts);
filters.addEventListener("change", renderPosts);
filters.addEventListener("submit", (event) => event.preventDefault());
document.addEventListener("pointerdown", (event) => {
  if (event.target instanceof Node && !popover.contains(event.target)) popover.open = false;
});
popover.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && popover.open) {
    popover.open = false;
    popover.querySelector("summary")?.focus();
  }
});
retry.addEventListener("click", () => void loadPosts());
void loadPosts();
void updateFollowers();
window.setInterval(() => {
  if (!document.hidden) void updateFollowers();
}, followerRefreshMs);
