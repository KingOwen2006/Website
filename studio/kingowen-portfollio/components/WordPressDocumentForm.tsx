import {useEffect} from 'react'
import {ObjectInputMember, type ObjectInputProps} from 'sanity'

const MAIN_FIELDS = new Set(['title', 'body'])
const EDITING_CLASS = 'wp-studio--editing'

function expandEditorToFullWidth(form: HTMLElement) {
  const touched: Array<{el: HTMLElement; style: string}> = []

  const remember = (el: HTMLElement) => {
    if (el.dataset.wpExpanded === 'true') return
    el.dataset.wpExpanded = 'true'
    touched.push({el, style: el.getAttribute('style') || ''})
    el.style.setProperty('width', '100%', 'important')
    el.style.setProperty('max-width', 'none', 'important')
    el.style.setProperty('min-width', '0', 'important')
    el.style.setProperty('height', 'auto', 'important')
    el.style.setProperty('max-height', 'none', 'important')
    el.style.setProperty('overflow', 'visible', 'important')
  }

  let node: HTMLElement | null = form
  while (node && node !== document.body) {
    if (node !== document.body && node !== document.documentElement) {
      remember(node)
    }
    const parent = node.parentElement
    if (!parent) break

    if (parent.getAttribute('data-ui') === 'PaneLayout') {
      Array.from(parent.children).forEach((child) => {
        if (!(child instanceof HTMLElement)) return
        if (child.contains(form) || child === form) {
          remember(child)
          return
        }
        child.dataset.wpHiddenPane = 'true'
        child.style.setProperty('display', 'none', 'important')
      })
    }

    node = parent
  }

  return () => {
    touched.forEach(({el, style}) => {
      delete el.dataset.wpExpanded
      if (style) el.setAttribute('style', style)
      else el.removeAttribute('style')
    })
    document.querySelectorAll('[data-wp-hidden-pane="true"]').forEach((el) => {
      if (!(el instanceof HTMLElement)) return
      delete el.dataset.wpHiddenPane
      el.style.removeProperty('display')
    })
  }
}

export function WordPressDocumentForm(props: ObjectInputProps) {
  const renderProps = {
    renderAnnotation: props.renderAnnotation,
    renderBlock: props.renderBlock,
    renderField: props.renderField,
    renderInlineBlock: props.renderInlineBlock,
    renderInput: props.renderInput,
    renderItem: props.renderItem,
    renderPreview: props.renderPreview,
  }

  const mainMembers = props.members.filter(
    (member) => member.kind === 'field' && MAIN_FIELDS.has(member.name),
  )
  const sideMembers = props.members.filter(
    (member) => member.kind !== 'field' || !MAIN_FIELDS.has(member.name),
  )

  useEffect(() => {
    document.documentElement.classList.add(EDITING_CLASS)
    document.body.classList.add(EDITING_CLASS)

    const form = document.querySelector('.wp-document-form')
    const restore = form instanceof HTMLElement ? expandEditorToFullWidth(form) : () => undefined

    return () => {
      restore()
      document.documentElement.classList.remove(EDITING_CLASS)
      document.body.classList.remove(EDITING_CLASS)
    }
  }, [])

  return (
    <div className="wp-document-form">
      <div className="wp-document-form__main">
        {mainMembers.map((member) => (
          <ObjectInputMember key={member.key} member={member} {...renderProps} />
        ))}
      </div>
      <aside className="wp-document-form__sidebar">
        {sideMembers.map((member) => (
          <ObjectInputMember key={member.key} member={member} {...renderProps} />
        ))}
      </aside>
    </div>
  )
}
