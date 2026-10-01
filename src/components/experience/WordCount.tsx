import { countPortableTextWords } from '../../lib/wordCount'

type WordCountProps = {
  body?: unknown[] | null
  includeReferences?: boolean
}

export function WordCount({ body, includeReferences = false }: WordCountProps) {
  return <p className="word-count">Word count: {countPortableTextWords(body, {includeReferences})}</p>
}
