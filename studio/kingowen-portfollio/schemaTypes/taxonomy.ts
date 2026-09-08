import {TagIcon} from '@sanity/icons/Tag'
import {defineField, defineType} from 'sanity'

export const taxonomy = defineType({
  name: 'taxonomy',
  title: 'Category or Tag',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Category', value: 'category'},
          {title: 'Tag', value: 'tag'},
        ],
        layout: 'radio',
      },
      initialValue: 'category',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      kind: 'kind',
    },
    prepare({title, kind}) {
      return {
        title,
        subtitle: kind === 'tag' ? 'Tag' : 'Category',
      }
    },
  },
})
