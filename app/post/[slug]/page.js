import { Suspense } from "react";

import EduPostCardGrid from "@/components/EduPostCardGrid";
import EduPostFooter from "@/components/EduPostFooter";
import { getSectionsFromPost } from "@/lib/edu-post-sections";
import { fetchPostBySlug, fetchPosts, sortPosts } from "@/lib/wp-data";

import PostPageClient from "./PostPageClient";
import PostPageSkeleton from "./PostPageSkeleton";

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

  return (
    <PostPageClient>
      <Suspense
        fallback={
          <>
            <PostPageSkeleton slug={slug} />
            <EduPostFooter />
          </>
        }
      >
        <PostPageBody slug={slug} />
      </Suspense>
    </PostPageClient>
  );
}

async function PostPageBody({ slug }) {
  let post = null;
  let error = null;

  try {
    post = await fetchPostBySlug("edu", slug);
  } catch (err) {
    error = err.message || "Failed to load post";
  }

  if (error) {
    return (
      <>
        <div id="post">
          <div
            style={{
              textAlign: "center",
              padding: "3rem 2rem",
              color: "var(--text-muted)",
            }}
          >
            <p style={{ marginBottom: "0.5rem" }}>Failed to load post.</p>
            <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>{error}</p>
          </div>
        </div>
        <EduPostFooter />
      </>
    );
  }

  const { sections } = getSectionsFromPost(post);

  return (
    <>
      <EduPostCardGrid post={post} sections={sections} />
      <EduPostFooter />
    </>
  );
}

export async function generateStaticParams() {
  try {
    const posts = await fetchPosts("edu");
    if (!Array.isArray(posts)) return [];
    return sortPosts(posts).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}
