import { Suspense } from "react";
import { notFound } from "next/navigation";

import EduPostFooter from "@/components/EduPostFooter";
import EduPostFullContent from "@/components/EduPostFullContent";
import { fetchPostBySlug, fetchPosts, sortPosts } from "@/lib/wp-data";

import PostPageClient from "../PostPageClient";
import SectionPageSkeleton from "../SectionPageSkeleton";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const post = await fetchPostBySlug("edu", slug);
    const title = post?.title?.rendered || post?.title || "Post";
    const plain = String(title).replace(/<[^>]+>/g, "").trim();
    return { title: `KingOwen | ${plain} (full)` };
  } catch {
    return { title: "KingOwen | Post" };
  }
}

export default async function EduPostFullPage({ params }) {
  const { slug } = await params;

  return (
    <PostPageClient>
      <Suspense
        fallback={
          <>
            <SectionPageSkeleton />
            <EduPostFooter />
          </>
        }
      >
        <FullPageBody slug={slug} />
      </Suspense>
    </PostPageClient>
  );
}

async function FullPageBody({ slug }) {
  let post;
  try {
    post = await fetchPostBySlug("edu", slug);
  } catch {
    notFound();
  }

  const raw = post?.content?.rendered || post?.content || "";
  if (!raw) notFound();

  const titleHtml = post?.title?.rendered || post?.title || "";

  return (
    <>
      <EduPostFullContent slug={slug} titleHtml={titleHtml} fullHtml={raw} />
      <EduPostFooter />
    </>
  );
}

export async function generateStaticParams() {
  try {
    const raw = await fetchPosts("edu");
    if (!Array.isArray(raw)) return [];
    return sortPosts(raw).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}
