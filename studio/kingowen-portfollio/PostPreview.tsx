import type {SanityDocument} from 'sanity'
import {imageUrl, StudioPortableText, type PreviewImage} from './preview/StudioPortableText'

type PreviewPost = Partial<SanityDocument> & {
  title?: string
  summary?: string
  thumbnail?: PreviewImage
  body?: unknown[]
  status?: 'draft' | 'published'
}

type PostPreviewProps = {
  document: {
    displayed: Partial<SanityDocument>
  }
}

export default function PostPreview({document}: PostPreviewProps) {
  const post = document.displayed as PreviewPost
  const featuredImage = imageUrl(post.thumbnail)
  const published = post.status === 'published'

  return (
    <div className="studio-post-preview">
      <article className="studio-post-preview__article">
        <div className={`studio-post-preview__badge${published ? ' studio-post-preview__badge--published' : ' studio-post-preview__badge--draft'}`}>
          {published ? 'Published' : 'Draft preview'}
        </div>
        <h1 className="studio-post-preview__title">{post.title || 'Untitled post'}</h1>
        {post.summary ? <p className="studio-post-preview__summary">{post.summary}</p> : null}
        {featuredImage ? (
          <img className="studio-post-preview__hero" src={featuredImage} alt={post.thumbnail?.alt || ''} />
        ) : null}
        <StudioPortableText value={post.body} />
      </article>
    </div>
  )
}
