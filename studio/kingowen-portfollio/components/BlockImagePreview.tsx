import type {PreviewProps} from 'sanity'

export function BlockImagePreview(props: PreviewProps) {
  return (
    <div className="wp-pt-media-preview">
      {props.renderDefault({
        ...props,
        title: undefined,
        subtitle: undefined,
        layout: 'block',
      })}
    </div>
  )
}
