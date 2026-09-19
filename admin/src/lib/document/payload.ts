import type {PostDoc} from './types'

export function postWritePayload(post: PostDoc) {
  return {
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    status: post.status,
    visibility: post.visibility || 'public',
    publishedAt: post.publishedAt,
    scheduledAt: post.scheduledAt,
    unitNumber: post.unitNumber,
    order: post.order,
    body: post.body,
    chapter: post.chapter?._id,
    author: post.author?._id,
    categories: post.categories?.map((item) => item._id),
    tags: post.tags?.map((item) => item._id),
    thumbnail: post.thumbnail,
    seo: post.seo,
  }
}
