import { countPortableTextWords } from '../../lib/wordCount'

type WordCountProps = {
  body?: unknown[] | null
}

export function WordCount({ body }: WordCountProps) {
  return <p className="word-count">Word count: {countPortableTextWords(body)}</p>
}
