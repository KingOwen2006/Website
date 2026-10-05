import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { useMemo } from 'react'
import type { UnitBySlugsQueryResult } from '../../sanity.types'
import { cleanPortableTextBody } from '../../lib/cleanText'
import { convertPhraseEmbedsInBody } from '../../lib/portableTextEmbeds'
import { linkifyPortableText } from '../../lib/portableTextLinks'
import UnitEmbed from './UnitEmbed'
import { WordCount } from './WordCount'
import UnitImageCompare from './UnitImageCompare'
import UnitImageFigure from './UnitImageFigure'
import UnitImageGallery from './UnitImageGallery'
import UnitImageRow from './UnitImageRow'
import { UnitLightboxProvider } from './UnitLightbox'

const components: PortableTextComponents = {
  block: {
    h1: ({ children }) => <h1 className="unit-body-h1">{children}</h1>,
    h2: ({ children }) => <h2 className="unit-body-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="unit-body-h3">{children}</h3>,
    h4: ({ children }) => <h4 className="unit-body-h4">{children}</h4>,
    h5: ({ children }) => <h5 className="unit-body-h5">{children}</h5>,
    h6: ({ children }) => <h6 className="unit-body-h6">{children}</h6>,
    blockquote: ({ children }) => <blockquote className="unit-body-quote">{children}</blockquote>,
  },
  marks: {
    underline: ({ children }) => <u>{children}</u>,
    'strike-through': ({ children }) => <s>{children}</s>,
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
    layoutRow: ({ value }) => (
      <div className="unit-layout-row">
        {(value?.items ?? []).map((item: {_key: string; body: NonNullable<PortableTextRendererProps['value']>}) => (
          <div key={item._key} className="unit-layout-cell">
            <PortableText value={item.body} components={components} />
          </div>
        ))}
      </div>
    ),
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
    separator: () => <hr className="unit-separator" />,
    spacer: ({ value }) => <div className="unit-spacer" style={{ height: value?.height ?? 40 }} />,
    buttonBlock: ({ value }) =>
      value?.href ? (
        <p>
          <a
            className={`unit-button unit-button--${value.style || 'primary'}`}
            href={value.href}
            target={value.openInNewTab ? '_blank' : undefined}
            rel={value.openInNewTab ? 'noopener noreferrer' : undefined}
          >
            {value.label || 'Button'}
          </a>
        </p>
      ) : null,
    columns: ({ value }) => (
      <div className="unit-columns">
        {(value?.items ?? []).map((item: {_key?: string; text?: string}, index: number) => (
          <div key={item._key || index} className="unit-column">
            {item.text}
          </div>
        ))}
      </div>
    ),
  },
}

type PortableTextRendererProps = {
  value?: NonNullable<UnitBySlugsQueryResult>['body']
  showWordCount?: boolean
  className?: string
}

export default function PortableTextRenderer({
  value,
  showWordCount = true,
  className,
}: PortableTextRendererProps) {
  const cleanedValue = useMemo(
    () => cleanPortableTextBody(linkifyPortableText(convertPhraseEmbedsInBody(value))),
    [value],
  )
  return (
    <>
      {showWordCount ? <WordCount body={cleanedValue} /> : null}
      {cleanedValue?.length ? (
        <UnitLightboxProvider>
          <div className={['unit-body-content', className].filter(Boolean).join(' ')}>
            <PortableText value={cleanedValue} components={components} />
          </div>
        </UnitLightboxProvider>
      ) : null}
    </>
  )
}
