import {defineSchema} from '@portabletext/editor'

const stringField = (name: string) => ({name, type: 'string' as const})
const objectField = (name: string) => ({name, type: 'object' as const})
const arrayField = (name: string) => ({name, type: 'array' as const})
const numberField = (name: string) => ({name, type: 'number' as const})

export const postEditorSchema = defineSchema({
  decorators: [
    {name: 'strong'},
    {name: 'em'},
    {name: 'underline'},
    {name: 'strike-through'},
    {name: 'code'},
  ],
  annotations: [{name: 'link', fields: [stringField('href')]}],
  styles: [
    {name: 'normal'},
    {name: 'h1'},
    {name: 'h2'},
    {name: 'h3'},
    {name: 'h4'},
    {name: 'h5'},
    {name: 'h6'},
    {name: 'blockquote'},
  ],
  lists: [{name: 'bullet'}, {name: 'number'}],
  blockObjects: [
    {
      name: 'image',
      fields: [objectField('asset'), stringField('alt'), stringField('caption'), stringField('size'), stringField('align')],
    },
    {name: 'imageRow', fields: [arrayField('images')]},
    {name: 'imageGallery', fields: [arrayField('images'), stringField('layout'), numberField('columns')]},
    {name: 'imageCompare', fields: [objectField('before'), objectField('after'), stringField('caption')]},
    {name: 'codeBlock', fields: [stringField('language'), stringField('filename'), stringField('code')]},
    {
      name: 'unitEmbed',
      fields: [stringField('embedType'), stringField('src'), stringField('href'), stringField('linkText')],
    },
    {name: 'separator'},
    {name: 'spacer', fields: [numberField('height')]},
    {name: 'buttonBlock', fields: [stringField('label'), stringField('href'), stringField('style')]},
    {name: 'columns', fields: [arrayField('items')]},
  ],
})
