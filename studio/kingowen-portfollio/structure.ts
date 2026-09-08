import {CalendarIcon} from '@sanity/icons/Calendar'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {FolderIcon} from '@sanity/icons/Folder'
import {TagIcon} from '@sanity/icons/Tag'
import {UserIcon} from '@sanity/icons/User'
import type {
  DefaultDocumentNodeResolver,
  StructureBuilder,
  StructureResolver,
} from 'sanity/structure'
import PostPreview from './PostPreview'

const DATE_ORDER = [{field: 'publishedAt', direction: 'desc'}] as const

function postList(
  S: StructureBuilder,
  title: string,
  filter: string,
  params: Record<string, string> = {},
) {
  return S.documentList()
    .title(title)
    .schemaType('unit')
    .filter(filter)
    .params(params)
    .defaultOrdering([...DATE_ORDER])
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Website')
    .items([
      S.listItem()
        .title('Posts')
        .icon(DocumentTextIcon)
        .child(postList(S, 'All posts', '_type == "unit"')),
      S.listItem()
        .title('Year 1')
        .icon(CalendarIcon)
        .child(
          postList(
            S,
            'Year 1 posts',
            '_type == "unit" && chapter->slug.current == $chapterSlug',
            {chapterSlug: 'bpc-level-3-year-1'},
          ),
        ),
      S.listItem()
        .title('Year 2')
        .icon(CalendarIcon)
        .child(
          postList(
            S,
            'Year 2 posts',
            '_type == "unit" && chapter->slug.current == $chapterSlug',
            {chapterSlug: 'bpc-level-3-year-2'},
          ),
        ),
      S.listItem()
        .title('Drafts')
        .icon(DocumentsIcon)
        .child(postList(S, 'Draft posts', '_type == "unit" && _id in path("drafts.**")')),
      S.listItem()
        .title('Published')
        .icon(EyeOpenIcon)
        .child(
          postList(
            S,
            'Published posts',
            '_type == "unit" && !(_id in path("drafts.**")) && coalesce(status, "published") == "published"',
          ),
        ),
      S.divider(),
      S.listItem()
        .title('Authors')
        .icon(UserIcon)
        .child(S.documentTypeList('author').title('Authors')),
      S.listItem()
        .title('Categories & tags')
        .icon(TagIcon)
        .child(
          S.list()
            .title('Categories & tags')
            .items([
              S.listItem()
                .title('Categories')
                .icon(FolderIcon)
                .child(
                  S.documentList()
                    .title('Categories')
                    .schemaType('taxonomy')
                    .filter('_type == "taxonomy" && kind == "category"'),
                ),
              S.listItem()
                .title('Tags')
                .icon(TagIcon)
                .child(
                  S.documentList()
                    .title('Tags')
                    .schemaType('taxonomy')
                    .filter('_type == "taxonomy" && kind == "tag"'),
                ),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('Course years')
        .icon(FolderIcon)
        .child(S.documentTypeList('chapter').title('Course years')),
    ])

export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) => {
  if (schemaType === 'unit') {
    return S.document().views([
      S.view.form().title('Write'),
      S.view.component(PostPreview).title('Live preview'),
    ])
  }

  return S.document().views([S.view.form()])
}
