import {useEffect, useRef} from 'react'
import {PatchEvent, set, useFormValue, type SlugInputProps} from 'sanity'

function slugify(value: string, maxLength = 96) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '')
}

function sourcePath(source: unknown): string[] {
  return typeof source === 'string' ? [source] : ['title']
}

export function AutoSlugInput(props: SlugInputProps) {
  const {onChange, schemaType, value} = props
  const sourceValue = useFormValue(sourcePath(schemaType.options?.source))
  const lastExpected = useRef<string | undefined>(undefined)
  const initialized = useRef(false)

  useEffect(() => {
    const title = typeof sourceValue === 'string' ? sourceValue.trim() : ''
    const maxLength = schemaType.options?.maxLength ?? 96
    const expected = title ? slugify(title, maxLength) : ''

    const timer = window.setTimeout(() => {
      const current = value?.current

      if (!initialized.current) {
        initialized.current = true
        lastExpected.current = expected || current
        if (!current && expected) {
          lastExpected.current = expected
          onChange(PatchEvent.from(set({_type: 'slug', current: expected})))
        }
        return
      }

      const shouldSync = !current || current === lastExpected.current
      if (shouldSync && expected && current !== expected) {
        onChange(PatchEvent.from(set({_type: 'slug', current: expected})))
      }
      lastExpected.current = expected || lastExpected.current
    }, 300)

    return () => window.clearTimeout(timer)
  }, [onChange, schemaType.options?.maxLength, sourceValue, value?.current])

  return props.renderDefault(props)
}
