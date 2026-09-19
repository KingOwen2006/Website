import {defineArrayMember, defineField, defineType} from 'sanity'
import {sanityImageFields} from './sharedImageFields'

export const imageGallery = defineType({
  name: 'imageGallery',
  title: 'Gallery',
  type: 'object',
  fields: [
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Grid', value: 'grid'},
          {title: 'Slider', value: 'slider'},
        ],
        layout: 'radio',
      },
      initialValue: 'grid',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'number',
      options: {
        list: [
          {title: '2 columns', value: 2},
          {title: '3 columns', value: 3},
        ],
      },
      initialValue: 2,
      hidden: ({parent}) => parent?.layout === 'slider',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {hotspot: true},
          fields: sanityImageFields,
        }),
      ],
      validation: (rule) => rule.min(2).max(12),
    }),
  ],
})
