import {type LayoutProps} from 'sanity'

export function StudioLayout(props: LayoutProps) {
  return (
    <div className="wp-studio" data-scheme="light" style={{colorScheme: 'light', minHeight: '100%'}}>
      {props.renderDefault(props)}
    </div>
  )
}
