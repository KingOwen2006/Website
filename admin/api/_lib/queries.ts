const IMAGE_EXPAND = `
  ...,
  asset->{_id, url, originalFilename, metadata { dimensions }}
`

const BODY_EXPAND = `
  body[]{
    ...,
    _type == "image" => { ${IMAGE_EXPAND} },
    _type == "imageRow" => { ..., images[]{ ${IMAGE_EXPAND} } },
    _type == "imageGallery" => { ..., images[]{ ${IMAGE_EXPAND} } },
    _type == "imageCompare" => {
      ...,
      before{ ${IMAGE_EXPAND} },
      after{ ${IMAGE_EXPAND} }
    }
  }
`

export const QUERIES = {
  dashboard: `{
    "posts": count(*[_type == "unit" && !defined(trashedAt)]),
    "published": count(*[_type == "unit" && !defined(trashedAt) && coalesce(status, "published") == "published"]),
    "drafts": count(*[_type == "unit" && !defined(trashedAt) && coalesce(status, "published") == "draft"]),
    "scheduled": count(*[_type == "unit" && !defined(trashedAt) && status == "scheduled"]),
    "trashed": count(*[_type == "unit" && defined(trashedAt)]),
    "authors": count(*[_type == "author"]),
    "categories": count(*[_type == "taxonomy" && kind == "category"]),
    "tags": count(*[_type == "taxonomy" && kind == "tag"]),
    "chapters": count(*[_type == "chapter"]),
    "media": count(*[_type == "sanity.imageAsset"]),
    "recent": *[_type == "unit" && !defined(trashedAt)] | order(_updatedAt desc)[0...8]{
      _id, title, status, _updatedAt, publishedAt
    }
  }`,
  posts: `*[
    _type == "unit"
    && select(
      $filter == "trash" => defined(trashedAt),
      !defined(trashedAt)
    )
    && select(
      $filter == "year-1" => chapter->slug.current == "bpc-level-3-year-1",
      $filter == "year-2" => chapter->slug.current == "bpc-level-3-year-2",
      $filter == "drafts" => coalesce(status, "published") == "draft",
      $filter == "published" => coalesce(status, "published") == "published",
      $filter == "scheduled" => status == "scheduled",
      $filter == "trash" => true,
      true
    )
  ] | order(coalesce(order, 999) asc, coalesce(unitNumber, 999) asc, title asc) {
    _id,
    title,
    "slug": slug.current,
    status,
    visibility,
    publishedAt,
    scheduledAt,
    trashedAt,
    order,
    unitNumber,
    _updatedAt,
    chapter->{_id, title, subtitle, "slug": slug.current},
    author->{_id, name},
    thumbnail { asset->{_id, url}, alt }
  }`,
  post: `*[_id == $id][0]{
    ...,
    "slug": slug.current,
    chapter->{_id, title, subtitle, "slug": slug.current},
    author->{_id, name},
    categories[]->{_id, title, "slug": slug.current, kind, parent->{_id}},
    tags[]->{_id, title, "slug": slug.current, kind},
    thumbnail { ${IMAGE_EXPAND}, alt, caption, crop, hotspot, transform },
    seo {
      ...,
      ogImage { ${IMAGE_EXPAND}, alt },
      twitterImage { ${IMAGE_EXPAND}, alt }
    },
    ${BODY_EXPAND}
  }`,
  authors: `*[_type == "author"] | order(name asc){
    _id, name, "slug": slug.current, bio, avatar { asset->{_id, url}, alt }
  }`,
  author: `*[_id == $id][0]{
    _id, name, "slug": slug.current, bio, avatar { ${IMAGE_EXPAND}, alt }
  }`,
  taxonomies: `*[_type == "taxonomy" && kind == $kind] | order(title asc){
    _id, title, "slug": slug.current, kind, description, parent->{_id, title}
  }`,
  taxonomy: `*[_id == $id][0]{
    _id, title, "slug": slug.current, kind, description, parent->{_id, title}
  }`,
  chapters: `*[_type == "chapter"] | order(order asc, title asc){
    _id, title, "slug": slug.current, subtitle, summary, dateRange, order,
    logo { asset->{_id, url} }
  }`,
  chapter: `*[_id == $id][0]{
    _id, title, "slug": slug.current, subtitle, summary, dateRange, order,
    logo { ${IMAGE_EXPAND} }
  }`,
  media: `*[_type == "sanity.imageAsset"] | order(_createdAt desc)[0...200]{
    _id, url, originalFilename, size, mimeType, _createdAt, title, altText, description, label,
    metadata { dimensions }
  }`,
  mediaPage: `{
    "items": *[
      _type == "sanity.imageAsset"
      && (
        !defined($search) || $search == "" ||
        originalFilename match $search ||
        title match $search ||
        altText match $search
      )
    ] | order(_createdAt desc) [$start...$end] {
      _id, url, originalFilename, size, mimeType, _createdAt, title, altText, description, label,
      metadata { dimensions }
    },
    "total": count(*[
      _type == "sanity.imageAsset"
      && (
        !defined($search) || $search == "" ||
        originalFilename match $search ||
        title match $search ||
        altText match $search
      )
    ])
  }`,
  mediaReferences: `count(*[references($id)])`,
  references: `{
    "chapters": *[_type == "chapter"] | order(order asc, title asc){ _id, title, "slug": slug.current },
    "authors": *[_type == "author"] | order(name asc){ _id, name },
    "categories": *[_type == "taxonomy" && kind == "category"] | order(title asc){ _id, title, parent->{_id} },
    "tags": *[_type == "taxonomy" && kind == "tag"] | order(title asc){ _id, title }
  }`,
  revisions: `*[_type == "postRevision" && post._ref == $postId] | order(createdAt desc)[0...50]{
    _id, createdAt, label
  }`,
  revision: `*[_id == $id][0]{
    _id, createdAt, label, snapshot, post->{_id}
  }`,
  slugCheck: `count(*[_type == "unit" && slug.current == $slug && _id != $id && !defined(trashedAt)])`,
  scheduledDue: `*[_type == "unit" && status == "scheduled" && defined(scheduledAt) && scheduledAt <= now() && !defined(trashedAt)]{_id, scheduledAt}`,
} as const

export type QueryName = keyof typeof QUERIES
