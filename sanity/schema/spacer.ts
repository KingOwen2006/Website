import {defineField, defineType} from 'sanity'

export const spacer = defineType({
  name: 'spacer',
  title: 'Spacer',
  type: 'object',
  fields: [
    defineField({
      name: 'height',
      title: 'Height',
      type: 'number',
      initialValue: 40,
      validation: (rule) => rule.min(8).max(240),
    }),
  ],
})
