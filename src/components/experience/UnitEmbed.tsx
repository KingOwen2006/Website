import { embedExternalHref } from '../../lib/embeds'
import { isYoutubeEmbed } from '../../lib/unitImages'
import GlbViewer from './GlbViewer'

export type UnitEmbedValue = {
  embedType?: 'model' | 'figma' | 'embed' | 'audio'
  src?: string
  href?: string
  linkText?: string
}

type UnitEmbedProps = {
  value: UnitEmbedValue
}

export default function UnitEmbed({ value }: UnitEmbedProps) {
  const src = value.src ?? ''
  const href = value.href || embedExternalHref(src)
  const linkText = value.linkText ?? 'Open'
  const embedType = value.embedType ?? 'embed'

  if (!src) return null

  if (embedType === 'audio') {
    return (
      <div className="figma-wrapper" data-ko-embed="audio">
        <audio controls preload="metadata" src={src} className="unit-embed-audio" />
        <a href={src} target="_blank" rel="noopener noreferrer" download className="embed-mobile-link">
          {linkText}
        </a>
      </div>
    )
  }

  if (embedType === 'model') {
    return (
      <div className="figma-wrapper model-viewer-wrapper" data-ko-embed="model">
        <GlbViewer src={src} />
        <a href={src} target="_blank" rel="noopener noreferrer" download className="embed-mobile-link">
          {linkText}
        </a>
      </div>
    )
  }

  return (
    <div className={`figma-wrapper${isYoutubeEmbed(src) ? ' unit-embed-video' : ''}`}>
      <iframe src={src} title={linkText} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
      <a href={href} target="_blank" rel="noopener noreferrer" className="embed-mobile-link">
        {linkText}
      </a>
    </div>
  )
}
