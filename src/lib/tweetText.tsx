import type { ReactNode } from 'react'
import { getTwitterProfileUrl } from '../lib/fxtwitter'

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
