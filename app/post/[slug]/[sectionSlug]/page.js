import { Suspense } from "react";
import { notFound } from "next/navigation";

import EduPostFooter from "@/components/EduPostFooter";
import EduPostSectionContent from "@/components/EduPostSectionContent";
import {
  getSectionsFromPost,
  stripTagsForTitle,
} from "@/lib/edu-post-sections";
import { fetchPostBySlug, fetchPosts, sortPosts } from "@/lib/wp-data";

import PostPageClient from "../PostPageClient";
import SectionPageSkeleton from "../SectionPageSkeleton";

export async function generateMetadata({ params }) {
  const { slug, sectionSlug } = await params;
  try {
    const post = await fetchPostBySlug("edu", slug);
    const { sections } = getSectionsFromPost(post);
    const section = sections.find((s) => s.slug === sectionSlug);
    if (!section) return { title: "KingOwen | Post" };
    const title = stripTagsForTitle(section.titleHtml);
    return { title: `KingOwen | ${title}` };
  } catch {
    return { title: "KingOwen | Post" };
  }
}

export default async function EduSectionPage({ params }) {
  const { slug, sectionSlug } = await params;

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
        <SectionPageBody slug={slug} sectionSlug={sectionSlug} />
      </Suspense>
    </PostPageClient>
  );
}

async function SectionPageBody({ slug, sectionSlug }) {
  let post;
  try {
    post = await fetchPostBySlug("edu", slug);
  } catch {
    notFound();
  }

  const { sections } = getSectionsFromPost(post);
  const i = sections.findIndex((s) => s.slug === sectionSlug);
  if (i < 0) notFound();

  const section = sections[i];
  const prevSlug = i > 0 ? sections[i - 1].slug : null;
  const nextSlug = i < sections.length - 1 ? sections[i + 1].slug : null;

  return (
    <>
      <EduPostSectionContent
        slug={slug}
        sectionSlug={section.slug}
        prevSlug={prevSlug}
        nextSlug={nextSlug}
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
        params.push({ slug: p.slug, sectionSlug: sections[i].slug });
      }
    }
    return params;
  } catch {
    return [];
  }
}
