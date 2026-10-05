import {defineArrayMember, defineField, defineType} from 'sanity'
import {sanityImageFields} from './sharedImageFields'

export const layoutRow = defineType({
  name: 'layoutRow', title: 'Row', type: 'object',
  fields: [defineField({
    name: 'items', title: 'Items', type: 'array',
    validation: (rule) => rule.required().min(2),
    of: [defineArrayMember({
      name: 'layoutCell', title: 'Row item', type: 'object',
      fields: [defineField({
        name: 'body', title: 'Content', type: 'array',
        of: [
          defineArrayMember({type: 'block', marks: {
            decorators: [
              {title: 'Strong', value: 'strong'}, {title: 'Emphasis', value: 'em'},
              {title: 'Underline', value: 'underline'}, {title: 'Strike', value: 'strike-through'},
              {title: 'Code', value: 'code'},
            ],
            annotations: [{name: 'link', type: 'object', title: 'Link', fields: [
              defineField({name: 'href', type: 'url', title: 'URL', validation: (rule) =>
                rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']})}),
              defineField({name: 'openInNewTab', type: 'boolean', title: 'Open in new tab'}),
            ]}],
          }}),
          defineArrayMember({type: 'image', options: {hotspot: true}, fields: sanityImageFields}),
        ],
      })],
      preview: {select: {body: 'body'}, prepare({body}) {
        return {title: body?.[0]?._type === 'image' ? 'Image' : 'Text'}
      }},
    })],
  })],
  preview: {select: {items: 'items'}, prepare({items}) {return {title: `Row · ${items?.length ?? 0} items`}}},
})
