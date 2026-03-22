import { Suspense } from "react";
import { notFound } from "next/navigation";

import EduPostFooter from "@/components/EduPostFooter";
import EduPostSectionContent from "@/components/EduPostSectionContent";
import {
  getSectionsFromPost,
  stripTagsForTitle,
} from "@/lib/edu-post-sections";
import { fetchPostBySlug, fetchPosts, sortPosts } from "@/lib/wp-data";

import PostPageClient from "../../PostPageClient";
import SectionPageSkeleton from "../../SectionPageSkeleton";

export async function generateMetadata({ params }) {
  const { slug, index } = await params;
  const i = parseInt(index, 10);
  if (Number.isNaN(i)) return { title: "KingOwen | Post" };
  try {
    const post = await fetchPostBySlug("edu", slug);
    const { sections } = getSectionsFromPost(post);
    if (i < 0 || i >= sections.length) return { title: "KingOwen | Post" };
    const title = stripTagsForTitle(sections[i].titleHtml);
    return { title: `KingOwen | ${title}` };
  } catch {
    return { title: "KingOwen | Post" };
  }
}

export default async function EduSectionPage({ params }) {
  const { slug, index } = await params;

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
        <SectionPageBody slug={slug} indexParam={index} />
      </Suspense>
    </PostPageClient>
  );
}

async function SectionPageBody({ slug, indexParam }) {
  const i = parseInt(indexParam, 10);
  if (Number.isNaN(i)) notFound();

  let post;
  try {
    post = await fetchPostBySlug("edu", slug);
  } catch {
    notFound();
  }

  const { sections } = getSectionsFromPost(post);
  if (i < 0 || i >= sections.length) notFound();

  const section = sections[i];

  return (
    <>
      <EduPostSectionContent
        slug={slug}
        sectionIndex={i}
        totalSections={sections.length}
        titleHtml={section.titleHtml}
        bodyHtml={section.bodyHtml}
      />
      <EduPostFooter />
    </>
  );
}

export async function generateStaticParams() {
  try {
    const raw = await fetchPosts("edu");
    if (!Array.isArray(raw)) return [];
    const posts = sortPosts(raw);
    const params = [];
    for (const p of posts) {
      const { sections } = getSectionsFromPost(p);
      const n = Math.max(1, sections.length);
      for (let i = 0; i < n; i++) {
        params.push({ slug: p.slug, index: String(i) });
      }
    }
    return params;
  } catch {
    return [];
  }
}
