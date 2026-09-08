import {PortableText, type PortableTextBlock, type PortableTextComponents} from '@portabletext/react'
import {
  createImageUrlBuilder,
  type SanityImageSource,
} from '@sanity/image-url'
import type {SanityDocument} from 'sanity'

type PreviewImage = {
  asset?: {_ref?: string}
  alt?: string
  caption?: string
}

type PreviewPost = Partial<SanityDocument> & {
  title?: string
  summary?: string
  thumbnail?: PreviewImage
  body?: PortableTextBlock[]
  publishedAt?: string
  status?: 'draft' | 'published'
}

type PostPreviewProps = {
  document: {
    displayed: Partial<SanityDocument>
  }
}

const imageBuilder = createImageUrlBuilder({
  projectId: 'bxr88bn5',
  dataset: 'production',
})

function imageUrl(source?: PreviewImage) {
  if (!source?.asset) return null
  return imageBuilder.image(source as SanityImageSource).width(1200).fit('max').auto('format').url()
}

const components: PortableTextComponents = {
  block: {
    h2: ({children}) => <h2 style={{fontSize: 28, margin: '32px 0 12px'}}>{children}</h2>,
    h3: ({children}) => <h3 style={{fontSize: 22, margin: '26px 0 10px'}}>{children}</h3>,
    h4: ({children}) => <h4 style={{fontSize: 18, margin: '22px 0 8px'}}>{children}</h4>,
    blockquote: ({children}) => (
      <blockquote
        style={{
          margin: '24px 0',
          padding: '4px 0 4px 18px',
          borderLeft: '4px solid #2563eb',
          color: '#475569',
        }}
      >
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({children, value}) => (
      <a href={value?.href} style={{color: '#2563eb'}}>
        {children}
      </a>
    ),
    code: ({children}) => (
      <code style={{padding: '2px 5px', borderRadius: 4, background: '#e2e8f0'}}>{children}</code>
    ),
  },
  types: {
    image: ({value}) => {
      const source = imageUrl(value as PreviewImage)
      if (!source) return null
      return (
        <figure style={{margin: '28px 0'}}>
          <img
            src={source}
            alt={(value as PreviewImage).alt || ''}
            style={{display: 'block', width: '100%', borderRadius: 14}}
          />
          {(value as PreviewImage).caption && (
            <figcaption style={{marginTop: 8, color: '#64748b', fontSize: 13}}>
              {(value as PreviewImage).caption}
            </figcaption>
          )}
        </figure>
      )
    },
    codeBlock: ({value}) => (
      <div style={{margin: '24px 0'}}>
        {value?.filename && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '10px 10px 0 0',
              background: '#334155',
              color: '#e2e8f0',
              fontSize: 12,
            }}
          >
            {value.filename}
          </div>
        )}
        <pre
          style={{
            margin: 0,
            padding: 18,
            overflowX: 'auto',
            borderRadius: value?.filename ? '0 0 10px 10px' : 10,
            background: '#0f172a',
            color: '#e2e8f0',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <code>{value?.code}</code>
        </pre>
      </div>
    ),
    unitEmbed: ({value}) => (
      <div
        style={{
          margin: '24px 0',
          padding: 18,
          border: '1px solid #cbd5e1',
          borderRadius: 12,
          background: '#f8fafc',
        }}
      >
        <strong>{value?.linkText || 'Embedded content'}</strong>
        <div style={{marginTop: 5, color: '#64748b', fontSize: 13}}>
          {value?.embedType || 'embed'} · {value?.src}
        </div>
      </div>
    ),
  },
}

export default function PostPreview({document}: PostPreviewProps) {
  const post = document.displayed as PreviewPost
  const featuredImage = imageUrl(post.thumbnail)

  return (
    <div style={{height: '100%', overflow: 'auto', background: '#ececee', padding: 28}}>
      <article
        style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: '32px clamp(24px, 5vw, 58px) 56px',
          borderRadius: 22,
          background: '#fff',
          color: '#1a1a1a',
          fontFamily:
            '"One UI Sans", "Samsung One", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          border: '1px solid #d5d7dc',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            marginBottom: 14,
            padding: '6px 9px',
            borderRadius: 999,
            background: post.status === 'published' ? '#dcfce7' : '#fef3c7',
            color: post.status === 'published' ? '#166534' : '#92400e',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {post.status === 'published' ? 'Published' : 'Draft preview'}
        </div>

        <h1 style={{margin: '0 0 12px', fontSize: 42, lineHeight: 1.05}}>
          {post.title || 'Untitled post'}
        </h1>

        {post.summary && (
          <p style={{margin: '0 0 22px', color: '#64748b', fontSize: 18, lineHeight: 1.55}}>
            {post.summary}
          </p>
        )}

        {featuredImage && (
          <img
            src={featuredImage}
            alt={post.thumbnail?.alt || ''}
            style={{display: 'block', width: '100%', marginBottom: 28, borderRadius: 16}}
          />
        )}

        {post.body?.length ? (
          <div style={{fontSize: 16, lineHeight: 1.75}}>
            <PortableText value={post.body} components={components} />
          </div>
        ) : (
          <p style={{color: '#64748b'}}>Start writing to see a live preview here.</p>
        )}
      </article>
    </div>
  )
}
