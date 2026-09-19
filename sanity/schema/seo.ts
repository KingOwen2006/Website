import {defineField, defineType} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'Search and social sharing',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      description: 'Optional. The post title is used when this is empty.',
      validation: (rule) => rule.max(60).warning('Search results may truncate titles over 60 characters.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'Optional. The summary is used when this is empty.',
      validation: (rule) =>
        rule.max(160).warning('Search results may truncate descriptions over 160 characters.'),
    }),
    defineField({
      name: 'ogTitle',
      title: 'Social title',
      type: 'string',
    }),
    defineField({
      name: 'ogDescription',
      title: 'Social description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'ogImage',
      title: 'Social image override',
      type: 'image',
      description: 'Optional. The featured image is used when this is empty.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'twitterTitle',
      title: 'X title',
      type: 'string',
    }),
    defineField({
      name: 'twitterDescription',
      title: 'X description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'twitterImage',
      title: 'X image',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
