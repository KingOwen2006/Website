import { defineQuery } from 'groq'
import type {
  ChapterBySlugQueryResult,
  UnitBySlugsQueryResult,
  UnitsByChapterSlugQueryResult,
} from '../../sanity.types'

export type Chapter = NonNullable<ChapterBySlugQueryResult>
export type UnitSummary = UnitsByChapterSlugQueryResult[number]
export type Unit = NonNullable<UnitBySlugsQueryResult>

export const chapterBySlugQuery = defineQuery(`
  *[_type == "chapter" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    subtitle,
    summary,
    dateRange,
    logo {
      asset->{ _id, url },
      alt
    }
  }
`)

export const unitsByChapterSlugQuery = defineQuery(`
  *[
    _type == "unit" &&
    chapter->slug.current == $slug &&
    coalesce(status, "published") == "published"
  ]
    | order(coalesce(order, 999) asc, coalesce(unitNumber, 999) asc, title asc) {
    _id,
    title,
    "slug": slug.current,
    summary,
    order,
    unitNumber,
    publishedAt,
    status,
    visibility,
    thumbnail {
      asset->{ _id, url },
      alt
    },
    categories[]->{
      _id,
      title,
      "slug": slug.current,
      kind
    }
  }
`)

export const unitBySlugsQuery = defineQuery(`
  *[
    _type == "unit" &&
    slug.current == $unitSlug &&
    chapter->slug.current == $chapterSlug &&
    coalesce(status, "published") == "published"
  ][0]{
    _id,
    title,
    "slug": slug.current,
    summary,
    order,
    unitNumber,
    publishedAt,
    status,
    visibility,
    body[]{
      ...,
      _type == "image" => {
        ...,
        asset->{ _id, url }
      },
      _type == "imageRow" => {
        ...,
        images[]{
          ...,
          asset->{ _id, url }
        }
      },
      _type == "imageGallery" => {
        ...,
        images[]{
          ...,
          asset->{ _id, url }
        }
      },
      _type == "imageCompare" => {
        ...,
        before{
          ...,
          asset->{ _id, url }
        },
        after{
          ...,
          asset->{ _id, url }
        }
      },
      _type == "unitEmbed" => {
        ...
      }
    },
    thumbnail {
      asset->{ _id, url },
      alt
    },
    author->{
      name,
      "slug": slug.current,
      bio,
      avatar {
        asset->{ _id, url },
        alt
      }
    },
    categories[]->{
      _id,
      title,
      "slug": slug.current,
      kind
    },
    tags[]->{
      _id,
      title,
      "slug": slug.current,
      kind
    },
    "seo": {
      "title": coalesce(seo.metaTitle, title, ""),
      "description": coalesce(seo.metaDescription, summary, ""),
      "image": coalesce(seo.ogImage, thumbnail) {
        asset->{ _id, url },
        alt
      },
      "noIndex": seo.noIndex == true
    },
    chapter->{
      _id,
      title,
      "slug": slug.current
    }
  }
`)

export type RecentUnit = {
  _id: string
  title: string
  slug: string | null
  summary: string | null
  publishedAt: string | null
  visibility?: string | null
  chapterSlug: string | null
  thumbnail: {
    asset?: { _id?: string; url?: string } | null
    alt?: string | null
  } | null
}

export const recentUnitsQuery = defineQuery(`
  *[
    _type == "unit" &&
    coalesce(status, "published") == "published" &&
    defined(slug.current) &&
    defined(chapter->slug.current)
  ]
    | order(coalesce(publishedAt, _createdAt) desc) [0...8] {
    _id,
    title,
    "slug": slug.current,
    summary,
    publishedAt,
    visibility,
    "chapterSlug": chapter->slug.current,
    thumbnail {
      asset->{ _id, url },
      alt
    }
  }
`)
