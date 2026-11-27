import {defineArrayMember, defineField, defineType} from 'sanity'

export const shopProduct = defineType({
  name: 'shopProduct', title: 'Shop product', type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: r => r.required().max(100)}),
    defineField({name: 'status', title: 'Visibility', type: 'string', initialValue: 'draft',
      options: {list: [{title: 'Draft · hidden from shop', value: 'draft'}, {title: 'Published · visible in shop', value: 'published'}, {title: 'Unlisted · direct link only', value: 'unlisted'}]},
      validation: r => r.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'title'}, validation: r => r.required()}),
    defineField({name: 'summary', type: 'text', rows: 2, validation: r => r.max(220)}),
    defineField({name: 'description', type: 'text', rows: 8}),
    defineField({name: 'category', type: 'string', options: {list: ['3D prints', 'Models', 'Artwork']}}),
    defineField({name: 'price', title: 'Price (GBP)', type: 'number', validation: r => r.required().min(0.5).precision(2)}),
    defineField({name: 'images', type: 'array', of: [defineArrayMember({type: 'image', options: {hotspot: true},
      fields: [defineField({name: 'alt', type: 'string', validation: r => r.required()})]})]}),
    defineField({name: 'details', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'availability', type: 'string', initialValue: 'coming-soon',
      options: {list: [{title: 'Available', value: 'available'}, {title: 'Coming soon', value: 'coming-soon'}, {title: 'Sold out', value: 'sold-out'}]},
      validation: r => r.required()}),
    defineField({name: 'requiresShipping', title: 'Collect a delivery address', type: 'boolean', initialValue: true}),
    defineField({name: 'sortOrder', type: 'number', initialValue: 0}),
  ],
  preview: {select: {title: 'title', media: 'images.0', subtitle: 'availability'}},
})

export const shopSettings = defineType({
  name: 'shopSettings', title: 'Shop settings', type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', initialValue: 'Shop'}),
    defineField({name: 'intro', type: 'text', rows: 2}),
    defineField({name: 'delivery', title: 'Delivery information', type: 'text'}),
    defineField({name: 'returns', title: 'Returns information', type: 'text'}),
    defineField({name: 'shippingPrice', title: 'Flat delivery charge (GBP)', type: 'number', initialValue: 0, validation: r => r.min(0).precision(2)}),
    defineField({name: 'shippingCountries', title: 'Delivery country codes', description: 'Two-letter codes, e.g. GB. Defaults to GB.', type: 'array',
      of: [defineArrayMember({type: 'string', validation: r => r.regex(/^[A-Z]{2}$/)})]}),
  ],
})

// Customer details and payment records stay in Stripe.
export const shopOrder = defineType({
  name: 'shopOrder', title: 'Shop order', type: 'document',
  readOnly: true,
  fields: [
    defineField({name: 'sessionId', type: 'string'}),
    defineField({name: 'paidAt', type: 'datetime'}),
    defineField({name: 'amount', title: 'Total in minor currency units', type: 'number'}),
    defineField({name: 'currency', type: 'string'}),
  ],
  preview: {select: {title: 'sessionId', subtitle: 'paidAt'}},
})
