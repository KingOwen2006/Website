import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {ImageIcon} from '@sanity/icons/Image'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {AutoSlugInput} from '../components/AutoSlugInput'
import {BlockImagePreview} from '../components/BlockImagePreview'
import {HideTitleField} from '../components/HideTitleField'
import {WordPressDocumentForm} from '../components/WordPressDocumentForm'
import {sanityImageFields} from './sharedImageFields'

export const unit = defineType({
  name: 'unit',
  title: 'Experience Post',
  type: 'document',
  icon: DocumentTextIcon,
  components: {
    input: WordPressDocumentForm,
  },
  // Hide Sanity's extra document title above the Gutenberg canvas.
  __experimental_formPreviewTitle: false,
  fieldsets: [
    {name: 'featured', title: 'Featured image', options: {collapsible: true, collapsed: false}},
    {name: 'publish', title: 'Publish', options: {collapsible: true, collapsed: false}},
    {name: 'organization', title: 'Categories', options: {collapsible: true, collapsed: false}},
    {name: 'seo', title: 'SEO', options: {collapsible: true, collapsed: true}},
    {name: 'legacy', title: 'Migration', options: {collapsible: true, collapsed: true}},
  ],
  initialValue: {
    status: 'draft',
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      fieldset: 'publish',
      description: 'Generated from the title as you type. You can still edit it.',
      components: {input: AutoSlugInput},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'chapter',
      title: 'Course year',
      type: 'reference',
      to: [{type: 'chapter'}],
      fieldset: 'organization',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Featured image',
      type: 'image',
      options: {hotspot: true},
      fieldset: 'featured',
      icon: ImageIcon,
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe the image for accessibility.',
          validation: (rule) => rule.required().warning('Add alt text for accessibility.'),
        }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Post content',
      type: 'array',
      components: {field: HideTitleField},
      options: {
        insertMenu: {
          filter: true,
          showIcons: true,
          groups: [
            {
              name: 'wordpressHtml',
              title: 'WordPress HTML',
              of: ['image', 'imageRow', 'imageGallery', 'imageCompare'],
            },
          ],
        },
      },
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bulleted list', value: 'bullet'},
            {title: 'Numbered list', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
              {title: 'Inline code', value: 'code'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (rule) =>
                      rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']}),
                  }),
                  defineField({
                    name: 'openInNewTab',
                    type: 'boolean',
                    title: 'Open in a new tab',
                    initialValue: true,
                  }),
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: 'image',
          title: 'Image',
          icon: ImageIcon,
          options: {hotspot: true},
          fields: sanityImageFields,
          components: {preview: BlockImagePreview},
          preview: {
            select: {media: 'asset'},
            prepare({media}) {
              return {media}
            },
          },
        }),
        defineArrayMember({type: 'imageRow', title: 'Images'}),
        defineArrayMember({type: 'imageGallery', title: 'Gallery'}),
        defineArrayMember({type: 'imageCompare', title: 'Image Compare'}),
        defineArrayMember({type: 'codeBlock'}),
        defineArrayMember({type: 'unitEmbed'}),
      ],
    }),
    defineField({
      name: 'summary',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      fieldset: 'publish',
      description: 'A short summary used on the Year 1/Year 2 post list.',
      validation: (rule) => rule.max(320).warning('Keep excerpts concise for post cards.'),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
      fieldset: 'organization',
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      fieldset: 'organization',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'taxonomy'}],
          options: {filter: 'kind == "category"'},
        }),
      ],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      fieldset: 'organization',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'taxonomy'}],
          options: {filter: 'kind == "tag"'},
        }),
      ],
      validation: (rule) => rule.unique().max(12).warning('Too many tags make posts harder to browse.'),
    }),
    defineField({
      name: 'status',
      title: 'Website visibility',
      type: 'string',
      fieldset: 'publish',
      description:
        'Set to Published and use Sanity’s Publish action to make the post visible on the website.',
      options: {
        list: [
          {title: 'Draft — hidden from website', value: 'draft'},
          {title: 'Published — visible on website', value: 'published'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published date',
      type: 'datetime',
      fieldset: 'publish',
      validation: (rule) =>
        rule.custom((value, context) => {
          if (context.document?.status === 'published' && !value) {
            return 'Add a published date before making this post visible.'
          }
          return true
        }),
    }),
    defineField({
      name: 'seo',
      title: 'Search and social sharing',
      type: 'seo',
      fieldset: 'seo',
    }),
    defineField({
      name: 'unitNumber',
      title: 'Unit number',
      type: 'number',
      fieldset: 'organization',
      description: 'Parsed from title for sorting (1–8). Non-numbered posts stay empty.',
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      fieldset: 'organization',
      description: 'Lower numbers appear first. Work experience currently uses 900.',
      initialValue: 0,
    }),
    defineField({
      name: 'legacyWordPressId',
      title: 'WordPress post ID',
      type: 'number',
      fieldset: 'legacy',
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: 'Unit number',
      name: 'unitNumberAsc',
      by: [
        {field: 'order', direction: 'asc'},
        {field: 'unitNumber', direction: 'asc'},
        {field: 'title', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      media: 'thumbnail',
      chapter: 'chapter.title',
      status: 'status',
      publishedAt: 'publishedAt',
    },
    prepare({title, media, chapter, status, publishedAt}) {
      const visibility = status === 'draft' ? 'Draft' : 'Published'
      const date = publishedAt
        ? new Intl.DateTimeFormat('en-GB', {dateStyle: 'medium'}).format(new Date(publishedAt))
        : 'No date'

      return {
        title,
        subtitle: [visibility, chapter, date].filter(Boolean).join(' • '),
        media,
      }
    },
  },
})
