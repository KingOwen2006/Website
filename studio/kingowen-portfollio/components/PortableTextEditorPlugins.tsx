import type {ReactNode} from 'react'
import {SlashCommandPlugin} from './SlashCommandPlugin'

type PluginProps = {
  renderDefault: (props: PluginProps) => ReactNode
}

export function PortableTextEditorPlugins(props: PluginProps) {
  return (
    <>
      {props.renderDefault(props)}
      <SlashCommandPlugin />
    </>
  )
}
