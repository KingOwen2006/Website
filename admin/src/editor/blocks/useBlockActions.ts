import {useEditor} from '@portabletext/editor'

export const IMAGE_DRAG_MIME = 'application/x-kingowen-image'

export function useBlockActions() {
  const editor = useEditor()

  const at = (key: string) => [{_key: key}] as [{_key: string}]

  return {
    editor,
    setProps(key: string, props: Record<string, unknown>) {
      editor.send({type: 'block.set', at: at(key), props})
      const current = (editor.getSnapshot().context.value as Array<Record<string, unknown>>).find(
        (block) => block._key === key,
      )
      if (!current) return
      const missing = Object.keys(props).some((name) => current[name] !== props[name])
      if (missing) {
        editor.send({type: 'set', at: at(key), value: {...current, ...props, _key: key}})
      }
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
  }
}

