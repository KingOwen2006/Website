import {InlineIcon} from '@sanity/icons/Inline'
import {defineArrayMember, defineField, defineType} from 'sanity'
import {sanityImageFields} from './sharedImageFields'

export const imageRow = defineType({
  name: 'imageRow',
  title: 'Images',
  type: 'object',
  icon: InlineIcon,
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
  preview: {
    select: {images: 'images'},
    prepare({images}) {
      return {
        title: 'Images',
        subtitle: `${images?.length ?? 0} images`,
      }
    },
  },
})
