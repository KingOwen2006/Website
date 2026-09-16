import type {FieldProps} from 'sanity'

export function HideTitleField(props: FieldProps) {
  return props.renderDefault({...props, title: undefined})
}
