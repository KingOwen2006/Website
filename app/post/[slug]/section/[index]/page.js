import { notFound, redirect } from "next/navigation";

import { getSectionsFromPost } from "@/lib/edu-post-sections";
import { fetchPostBySlug } from "@/lib/wp-data";

/**
 * Legacy URL: /post/[slug]/section/[index] → /post/[slug]/[sectionSlug]
 */
export default async function LegacySectionIndexRedirect({ params }) {
  const { slug, index } = await params;
  const i = parseInt(index, 10);
  if (Number.isNaN(i)) notFound();

  let post;
  try {
    post = await fetchPostBySlug("edu", slug);
  } catch {
    notFound();
  }

  const { sections } = getSectionsFromPost(post);
  if (i < 0 || i >= sections.length) notFound();

  redirect(`/post/${slug}/${sections[i].slug}`);
}
