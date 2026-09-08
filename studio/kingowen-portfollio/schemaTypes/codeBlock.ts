import {CodeBlockIcon} from '@sanity/icons/CodeBlock'
import {defineField, defineType} from 'sanity'

export const codeBlock = defineType({
  name: 'codeBlock',
  title: 'Code block',
  type: 'object',
  icon: CodeBlockIcon,
  fields: [
    defineField({
      name: 'code',
      title: 'Code',
      type: 'text',
      rows: 14,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          {title: 'Plain text', value: 'text'},
          {title: 'JavaScript', value: 'javascript'},
          {title: 'TypeScript', value: 'typescript'},
          {title: 'JSX', value: 'jsx'},
          {title: 'TSX', value: 'tsx'},
          {title: 'HTML', value: 'html'},
          {title: 'CSS', value: 'css'},
          {title: 'JSON', value: 'json'},
          {title: 'C#', value: 'csharp'},
          {title: 'Python', value: 'python'},
          {title: 'Shell', value: 'shell'},
        ],
      },
      initialValue: 'text',
    }),
    defineField({
      name: 'filename',
      title: 'Filename',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      code: 'code',
      filename: 'filename',
      language: 'language',
    },
    prepare({code, filename, language}) {
      return {
        title: filename || 'Code block',
        subtitle: `${language || 'text'} — ${String(code || '').split('\n')[0]}`,
      }
    },
  },
})
