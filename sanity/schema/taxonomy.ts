import {defineField, defineType} from 'sanity'

export const taxonomy = defineType({
  name: 'taxonomy',
  title: 'Category or Tag',
  type: 'document',
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
    defineField({
      name: 'parent',
      title: 'Parent category',
      type: 'reference',
      to: [{type: 'taxonomy'}],
      hidden: ({document}) => document?.kind !== 'category',
      options: {filter: 'kind == "category"'},
    }),
  ],
})
