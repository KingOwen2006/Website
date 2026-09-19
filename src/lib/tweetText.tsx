import type { ReactNode } from 'react'
import { getTwitterProfileUrl } from '../lib/fxtwitter'

const HASHTAG_PATTERN = /#[\w\u0080-\uFFFF]+/g

export function stripHashtags(text: string): string {
  return text
    .replace(HASHTAG_PATTERN, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function splitFeedCopy(text: string): {
  headline: string
  excerpt: string
  truncated: boolean
} {
  const cleaned = stripHashtags(text)
  if (!cleaned) {
    return { headline: '', excerpt: '', truncated: false }
  }

  const sentence = cleaned.match(/^(.+?[.!?])(?:\s+([\s\S]+))?$/)
  if (sentence?.[1] && sentence[2]) {
    const remainder = sentence[2].trim()
    const truncated = remainder.length > 220
    return {
      headline: sentence[1],
      excerpt: truncated ? `${remainder.slice(0, 220).trimEnd()}…` : remainder,
      truncated,
    }
  }

  if (cleaned.length > 140) {
    const cut = cleaned.slice(0, 140)
    const lastSpace = cut.lastIndexOf(' ')
    const breakAt = lastSpace > 80 ? lastSpace : 140
    return {
      headline: `${cleaned.slice(0, breakAt).trim()}…`,
      excerpt: cleaned.slice(breakAt).trim(),
      truncated: true,
    }
  }

  return { headline: cleaned, excerpt: '', truncated: false }
}

export function formatTweetText(text: string): ReactNode[] {
  const parts = text.split(/(#[\w\u0080-\uFFFF]+|@[A-Za-z0-9_]+)/g)

  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      return (
        <span key={`${part}-${index}`} className="tweet-hashtag">
          {part}
        </span>
      )
    }

    if (part.startsWith('@')) {
      const handle = part.slice(1)

      return (
        <a
          key={`${part}-${index}`}
          className="tweet-mention"
          href={getTwitterProfileUrl(handle)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
        >
          {part}
        </a>
      )
    }

    return part
  })
}
