import {defineArrayMember, defineField, defineType} from 'sanity'

export const columns = defineType({
  name: 'columns',
  title: 'Columns',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      title: 'Columns',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'text',
              title: 'Text',
              type: 'text',
              rows: 4,
            }),
          ],
        }),
      ],
      validation: (rule) => rule.min(2).max(3),
    }),
  ],
})
