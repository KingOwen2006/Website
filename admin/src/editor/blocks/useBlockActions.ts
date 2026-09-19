import {useEditor} from '@portabletext/editor'
import type {ImageValue} from '../../lib/document/types'

export const IMAGE_DRAG_MIME = 'application/x-kingowen-image'

export function useBlockActions() {
  const editor = useEditor()

  const at = (key: string) => [{_key: key}] as [{_key: string}]

  return {
    editor,
    setProps(key: string, props: Record<string, unknown>) {
      editor.send({type: 'block.set', at: at(key), props})
    },
    replace(key: string, value: Record<string, unknown>) {
      editor.send({type: 'set', at: at(key), value})
    },
    remove(key: string) {
      editor.send({type: 'delete.block', at: at(key)})
    },
    moveUp(key: string) {
      editor.send({type: 'move.block up', at: at(key)})
    },
    moveDown(key: string) {
      editor.send({type: 'move.block down', at: at(key)})
    },
    duplicate(node: Record<string, unknown>) {
      const rest = {...node}
      delete rest._key
      editor.send({
        type: 'insert.block',
        block: rest as never,
        placement: 'after',
      })
    },
    select(key: string) {
      editor.send({type: 'select.block', at: at(key)})
    },
    mergeIntoRow(targetKey: string, source: ImageValue & {_key?: string}) {
      const snapshot = editor.getSnapshot()
      const blocks = snapshot.context.value as Array<Record<string, unknown> & {_key?: string; _type?: string}>
      const target = blocks.find((block) => block._key === targetKey)
      if (!target) return

      const sourceImage: ImageValue = {
        _type: 'image',
        asset: source.asset,
        alt: source.alt ?? '',
        caption: source.caption,
        size: source.size,
        align: source.align,
      }

      if (target._type === 'imageRow' && Array.isArray(target.images)) {
        editor.send({
          type: 'block.set',
          at: at(targetKey),
          props: {images: [...(target.images as ImageValue[]), sourceImage]},
        })
      } else if (target._type === 'image') {
        editor.send({
          type: 'set',
          at: at(targetKey),
          value: {
            _type: 'imageRow',
            _key: targetKey,
            images: [target as ImageValue, sourceImage],
          },
        })
      } else {
        return
      }

      if (source._key && source._key !== targetKey) {
        editor.send({type: 'delete.block', at: at(source._key)})
      }
    },
  }
}
