import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { useMemo } from 'react'
import type { UnitBySlugsQueryResult } from '../../sanity.types'
import { cleanPortableTextBody } from '../../lib/cleanText'
import { convertPhraseEmbedsInBody } from '../../lib/portableTextEmbeds'
import UnitEmbed from './UnitEmbed'
import UnitImageCompare from './UnitImageCompare'
import UnitImageFigure from './UnitImageFigure'
import UnitImageGallery from './UnitImageGallery'
import UnitImageRow from './UnitImageRow'
import { UnitLightboxProvider } from './UnitLightbox'

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="unit-body-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="unit-body-h3">{children}</h3>,
    h4: ({ children }) => <h4 className="unit-body-h4">{children}</h4>,
    blockquote: ({ children }) => <blockquote className="unit-body-quote">{children}</blockquote>,
  },
  marks: {
    link: ({ value, children }) => {
      const href = value?.href
      if (!href) return <>{children}</>
      const external = href.startsWith('http')
      const openInNewTab = value?.openInNewTab ?? external
      return (
        <a
          href={href}
          className="unit-body-link"
          target={openInNewTab ? '_blank' : undefined}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      )
    },
    code: ({ children }) => <code className="unit-body-inline-code">{children}</code>,
  },
  types: {
    image: ({ value }) => <UnitImageFigure value={value} />,
    imageRow: ({ value }) => <UnitImageRow images={value?.images} />,
    imageGallery: ({ value }) => (
      <UnitImageGallery layout={value?.layout} columns={value?.columns} images={value?.images} />
    ),
    imageCompare: ({ value }) => (
      <UnitImageCompare before={value?.before} after={value?.after} caption={value?.caption} />
    ),
    codeBlock: ({ value }) => (
      <figure className="unit-code-block">
        {value?.filename && <figcaption className="unit-code-filename">{value.filename}</figcaption>}
        <pre className="unit-code-pre" data-language={value?.language ?? 'text'}>
          <code>{value?.code}</code>
        </pre>
      </figure>
    ),
    unitEmbed: ({ value }) => <UnitEmbed value={value} />,
  },
}

type PortableTextRendererProps = {
  value?: NonNullable<UnitBySlugsQueryResult>['body']
}

export default function PortableTextRenderer({ value }: PortableTextRendererProps) {
  const cleanedValue = useMemo(
    () => cleanPortableTextBody(convertPhraseEmbedsInBody(value)),
    [value],
  )
  if (!cleanedValue?.length) return null
  return (
    <UnitLightboxProvider>
      <div className="unit-body-content">
        <PortableText value={cleanedValue} components={components} />
      </div>
    </UnitLightboxProvider>
  )
}
