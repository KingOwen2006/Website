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
  defineField({
    name: 'align',
    type: 'string',
    title: 'Alignment',
    options: {
      list: [
        {title: 'Default', value: 'default'},
        {title: 'Left', value: 'left'},
        {title: 'Center', value: 'center'},
        {title: 'Right', value: 'right'},
      ],
      layout: 'radio',
    },
    initialValue: 'default',
  }),
  defineField({
    name: 'transform',
    type: 'object',
    title: 'Display transform',
    fields: [
      defineField({name: 'rotate', type: 'number', initialValue: 0}),
      defineField({name: 'flipH', type: 'boolean', initialValue: false}),
      defineField({name: 'flipV', type: 'boolean', initialValue: false}),
    ],
  }),
]
