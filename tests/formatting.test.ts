import assert from 'node:assert/strict'
import {test} from 'node:test'
import {formattingBody} from './fixtures/editorFormatting'
import {linkifyPortableText} from '../src/lib/portableTextLinks'
import {countPortableTextWords} from '../src/lib/wordCount'
import {splitUnitSections} from '../src/lib/unitSections'

test('beta section cards include row text and retain row item ordering', () => {
  const sections = splitUnitSections(formattingBody)
  assert.equal(sections[0].slug, 'new-layouts')
  assert.equal(sections[0].excerpt, 'Side by side text keeps its formatting.')
  const rows = sections[0].blocks.filter((block) => block._type === 'layoutRow')
  assert.equal(rows.length, 2)
  assert.deepEqual((rows[1].items as Array<{_key: string}>).map((cell) => cell._key), ['left', 'right'])
})

test('beta word counts include text inside rows and exclude references by default', () => {
  assert.equal(countPortableTextWords(formattingBody), 9)
  assert.ok(countPortableTextWords(formattingBody, {includeReferences: true}) > 9)
})

test('existing reference URLs gain links without changing post content', () => {
  const linked = linkifyPortableText(formattingBody as Array<{_key: string; _type: string; [key: string]: unknown}>)!
  assert.notStrictEqual(linked, formattingBody)
  assert.strictEqual(linked[1], formattingBody[1])
  assert.equal((linked.at(-1)!.markDefs as Array<{href: string}>)[0].href, 'https://www.nhs.uk/mental-health/conditions/schizophrenia/overview/')
})
