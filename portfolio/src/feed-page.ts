import "./styles.css";
import { fetchFeedPage, fetchFollowerCount, makePost, readCachedFeedPage, type FeedPage, type FeedPost } from "./feed";
import { element, mountNavigation } from "./navigation";

mountNavigation("feed");
const list = element("#feed-list");
const ghosts = [...list.children];
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
let refreshing = false;

function date(post: FeedPost) {
  return Number.isFinite(post.date) ? post.date : 0;
}

function updateCards(shown: FeedPost[]) {
  if (loading && !posts.size) {
    if (list.firstElementChild !== ghosts[0]) list.replaceChildren(...ghosts);
    list.setAttribute("aria-busy", "true");
    return;
  }

  let next = list.firstElementChild;
  for (const post of shown) {
    const card = cards.get(post.id)!;
    if (card === next) next = next.nextElementSibling;
    else list.insertBefore(card, next);
  }
  while (next) {
    const following = next.nextElementSibling;
    next.remove();
    next = following;
  }
  list.setAttribute("aria-busy", "false");
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
  updateCards(shown);
  if (failed) {
    if (refreshing) {
      status.textContent = "Couldn’t refresh the feed. Showing previously loaded posts.";
      return;
    }
    status.textContent = posts.size ? `Showing ${shown.length} of ${posts.size} loaded posts. Older posts couldn’t be loaded.`
      : "The feed is temporarily unavailable.";
  } else if (loading) {
    status.textContent = refreshing ? `${shown.length} shown. Refreshing posts…`
      : posts.size ? `${shown.length} shown. Loading older posts…` : "Loading posts…";
  } else {
    status.textContent = shown.length ? `${shown.length} ${shown.length === 1 ? "post" : "posts"} from @KingOwenFYI`
      : posts.size ? "No posts match your search." : "FxTwitter has no posts available for this account.";
  }
}

function addPosts(incoming: FeedPost[]) {
  for (const post of incoming) {
    if (posts.has(post.id)) continue;
    posts.set(post.id, post);
    cards.set(post.id, makePost(post, true));
  }
}

function acceptPage(page: FeedPage) {
  if (page.cursor && seenCursors.has(page.cursor)) throw new Error("Repeated FxTwitter cursor");
  addPosts(page.posts);
  cursor = page.cursor;
  if (cursor) seenCursors.add(cursor);
  loading = Boolean(cursor);
}

async function loadPosts() {
  retry.hidden = true;
  failed = false;
  loading = true;
  if (!cursor && !posts.size) {
    const cached = readCachedFeedPage();
    if (cached?.fresh) acceptPage(cached.page);
    else if (cached) {
      addPosts(cached.page.posts);
      refreshing = true;
    }
  }
  renderPosts();
  if (!loading) return;
  try {
    do {
      const page = await fetchFeedPage(cursor);
      if (refreshing) {
        posts.clear();
        cards.clear();
        refreshing = false;
      }
      acceptPage(page);
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
