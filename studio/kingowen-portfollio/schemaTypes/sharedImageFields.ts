import {defineField} from 'sanity'

export const sanityImageFields = [
  defineField({
    name: 'alt',
    type: 'string',
    title: 'Alt text',
    validation: (rule) => rule.required().warning('Add alt text for accessibility.'),
  }),
  defineField({
    name: 'caption',
    type: 'string',
    title: 'Caption',
  }),
  defineField({
    name: 'size',
    type: 'string',
    title: 'Display size',
    options: {
      list: [
        {title: 'Default', value: 'default'},
        {title: 'Wide', value: 'wide'},
        {title: 'Narrow', value: 'narrow'},
      ],
      layout: 'radio',
    },
    initialValue: 'default',
  }),
]
