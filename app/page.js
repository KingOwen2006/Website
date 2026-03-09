import { fetchPosts, sortPosts } from "@/lib/wp-data";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  let posts = [];
  try {
    const raw = await fetchPosts("edu");
    posts = sortPosts(Array.isArray(raw) ? raw : []);
  } catch (err) {
    console.error("Failed to fetch posts:", err);
  }

  return <HomeClient posts={posts} />;
}
