import {defineArrayMember, defineField, defineType} from 'sanity'
import {sanityImageFields} from './sharedImageFields'

export const imageRow = defineType({
  name: 'imageRow',
  title: 'Images',
  type: 'object',
  fields: [
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
      validation: (rule) => rule.min(2).max(2),
    }),
  ],
})
