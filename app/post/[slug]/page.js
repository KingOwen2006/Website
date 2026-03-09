import { fetchPostBySlug, fetchPosts, sortPosts } from "@/lib/wp-data";
import PostPageClient from "./PostPageClient";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const post = await fetchPostBySlug("edu", slug);
    const title = post?.title?.rendered || post?.title || "Post";
    return { title: `KingOwen | ${title.replace(/<[^>]+>/g, "")}` };
  } catch {
    return { title: "KingOwen | Post" };
  }
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  let post = null;
  let error = null;

  try {
    post = await fetchPostBySlug("edu", slug);
  } catch (err) {
    error = err.message || "Failed to load post";
  }

  return <PostPageClient post={post} error={error} />;
}

export async function generateStaticParams() {
  try {
    const posts = await fetchPosts("edu");
    if (!Array.isArray(posts)) return [];
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}
