import {defineField, defineType} from 'sanity'

export const separator = defineType({
  name: 'separator',
  title: 'Separator',
  type: 'object',
  fields: [
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      initialValue: 'solid',
      hidden: true,
    }),
  ],
})
