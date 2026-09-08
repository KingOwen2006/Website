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
    thumbnail {
      asset->{ _id, url },
      alt
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
