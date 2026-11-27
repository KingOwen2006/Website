import { defineQuery } from "groq";

export const educationQuery = defineQuery(`
  *[_type == "chapter" && defined(slug.current)]
    | order(coalesce(order, 999) asc, slug.current desc) {
      title, "slug": slug.current, subtitle, summary, dateRange,
      "units": *[
        _type == "unit" && chapter._ref == ^._id && defined(slug.current) &&
        coalesce(status, "published") == "published" &&
        coalesce(visibility, "public") == "public" && !defined(trashedAt)
      ] | order(coalesce(order, 999) asc, coalesce(unitNumber, 999) asc, title asc) {
        title, "slug": slug.current, summary,
        "gradeSlugs": array::unique(coalesce(tags[]->slug.current, []) + coalesce(categories[]->slug.current, [])),
        "thumbnail": {
          "url": coalesce(thumbnail.asset->url, body[_type == "image" && defined(asset)][0].asset->url),
          "alt": coalesce(thumbnail.alt, body[_type == "image" && defined(asset)][0].alt)
        }
      }
    }
`);

export const educationUnitQuery = defineQuery(`
  *[_type == "unit" && slug.current == $unitSlug && chapter->slug.current == $chapterSlug &&
    coalesce(status, "published") == "published" &&
    coalesce(visibility, "public") == "public" && !defined(trashedAt)
  ][0] {
    body[] {
      ...,
      _type == "image" => { "url": asset->url },
      _type in ["imageRow", "imageGallery"] => { images[] { ..., "url": asset->url } },
      _type == "imageCompare" => { before { ..., "url": asset->url }, after { ..., "url": asset->url } },
      _type == "layoutRow" => { items[] { body[] { ..., _type == "image" => { "url": asset->url } } } }
    }
  }
`);
