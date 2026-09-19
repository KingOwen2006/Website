import {defineField, defineType} from 'sanity'

export const postRevision = defineType({
  name: 'postRevision',
  title: 'Post revision',
  type: 'document',
  fields: [
    defineField({
      name: 'post',
      title: 'Post',
      type: 'reference',
      to: [{type: 'unit'}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'createdAt',
      title: 'Created at',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      initialValue: 'Autosave',
    }),
    defineField({
      name: 'snapshot',
      title: 'Snapshot JSON',
      type: 'text',
      description: 'Serialized post fields used to compare and restore revisions.',
    }),
  ],
})
