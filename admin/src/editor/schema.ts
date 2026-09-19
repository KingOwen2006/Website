import {defineSchema} from '@portabletext/editor'

export const postEditorSchema = defineSchema({
  decorators: [
    {name: 'strong'},
    {name: 'em'},
    {name: 'underline'},
    {name: 'strike-through'},
    {name: 'code'},
  ],
  annotations: [{name: 'link'}],
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
    {name: 'image'},
    {name: 'imageRow'},
    {name: 'imageGallery'},
    {name: 'imageCompare'},
    {name: 'codeBlock'},
    {name: 'unitEmbed'},
    {name: 'separator'},
    {name: 'spacer'},
    {name: 'buttonBlock'},
    {name: 'columns'},
  ],
})
