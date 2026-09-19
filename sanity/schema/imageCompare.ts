import {defineField, defineType} from 'sanity'
import {sanityImageFields} from './sharedImageFields'

export const imageCompare = defineType({
  name: 'imageCompare',
  title: 'Image Compare',
  type: 'object',
  fields: [
    defineField({
      name: 'before',
      title: 'Before image',
      type: 'image',
      options: {hotspot: true},
      fields: sanityImageFields,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'after',
      title: 'After image',
      type: 'image',
      options: {hotspot: true},
      fields: sanityImageFields,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
  ],
})
