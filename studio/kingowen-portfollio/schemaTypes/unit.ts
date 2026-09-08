import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {ImageIcon} from '@sanity/icons/Image'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {sanityImageFields} from './sharedImageFields'

export const unit = defineType({
  name: 'unit',
  title: 'Experience Post',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    {name: 'content', title: 'Post', default: true},
    {name: 'organization', title: 'Categories & author'},
    {name: 'publishing', title: 'Publishing'},
    {name: 'seo', title: 'SEO'},
    {name: 'legacy', title: 'Migration'},
  ],
  initialValue: {
    status: 'draft',
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      group: 'content',
      description: 'Generated from the title. You can edit it before publishing.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'chapter',
      title: 'Course year',
      type: 'reference',
      to: [{type: 'chapter'}],
      group: 'organization',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Featured image',
      type: 'image',
      options: {hotspot: true},
      group: 'content',
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
      name: 'summary',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'A short summary used on the Year 1/Year 2 post list.',
      validation: (rule) => rule.max(320).warning('Keep excerpts concise for post cards.'),
    }),
    defineField({
      name: 'body',
      title: 'Post content',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
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
        }),
        defineArrayMember({type: 'imageRow'}),
        defineArrayMember({type: 'imageGallery'}),
        defineArrayMember({type: 'imageCompare'}),
        defineArrayMember({type: 'codeBlock'}),
        defineArrayMember({type: 'unitEmbed'}),
      ],
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{type: 'author'}],
      group: 'organization',
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      group: 'organization',
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
      group: 'organization',
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
      group: 'publishing',
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
      group: 'publishing',
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
      group: 'seo',
    }),
    defineField({
      name: 'unitNumber',
      title: 'Unit number',
      type: 'number',
      group: 'organization',
      description: 'Parsed from title for sorting (1–8). Non-numbered posts stay empty.',
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      group: 'organization',
      description: 'Lower numbers appear first. Work experience currently uses 900.',
      initialValue: 0,
    }),
    defineField({
      name: 'legacyWordPressId',
      title: 'WordPress post ID',
      type: 'number',
      group: 'legacy',
      readOnly: true,
    }),
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
