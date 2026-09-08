import {defineField, defineType} from 'sanity'

export const unitEmbed = defineType({
  name: 'unitEmbed',
  title: 'Embed',
  type: 'object',
  fields: [
    defineField({
      name: 'embedType',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Iframe / YouTube', value: 'embed'},
          {title: 'Figma', value: 'figma'},
          {title: 'Audio', value: 'audio'},
          {title: '3D model', value: 'model'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'src',
      title: 'Source URL',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Link URL',
      type: 'string',
    }),
    defineField({
      name: 'linkText',
      title: 'Link label',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      embedType: 'embedType',
      linkText: 'linkText',
      src: 'src',
    },
    prepare({embedType, linkText, src}) {
      return {
        title: linkText || embedType || 'Embed',
        subtitle: src,
      }
    },
  },
})
