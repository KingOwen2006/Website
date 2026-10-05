import assert from 'node:assert/strict'
import {test} from 'node:test'
import {linkifyPortableText} from '../../../src/lib/portableTextLinks'

const span = (text: string, key = 's', marks: string[] = []) => ({_type: 'span', _key: key, text, marks})
const block = (children: ReturnType<typeof span>[], markDefs: any[] = []): any =>
  ({_type: 'block', _key: 'b', style: 'normal', children, markDefs})

test('reference URLs become links without swallowing citation punctuation', () => {
  const input = [block([span('NHS https://www.nhs.uk/mental-health/ [Accessed today]. See (https://en.wikipedia.org/wiki/Grief). Also www.example.com.')])]
  const output = linkifyPortableText(input)!
  assert.deepEqual(output[0].markDefs.map((mark: any) => mark.href),
    ['https://www.nhs.uk/mental-health/', 'https://en.wikipedia.org/wiki/Grief', 'https://www.example.com'])
  assert.equal(output[0].children.map((child: any) => child.text).join(''), input[0].children[0].text)
  assert.equal(input[0].markDefs.length, 0)
  assert.strictEqual(linkifyPortableText(output), output)
})

test('links spanning decorated text preserve all text and decorators', () => {
  const input = [block([span('See https://example.', 'one', ['strong']), span('com/page_(one)', 'two', ['em']), span('', 'empty')])]
  const output = linkifyPortableText(input)!
  assert.equal(output[0].markDefs[0].href, 'https://example.com/page_(one)')
  const linked = output[0].children.filter((child: any) => child.marks.includes(output[0].markDefs[0]._key))
  assert.deepEqual(linked.map((child: any) => child.marks[0]), ['strong', 'em'])
  assert.equal(linked.map((child: any) => child.text).join(''), 'https://example.com/page_(one)')
  assert.equal(output[0].children.at(-1)._key, 'empty')
})

test('explicit links and ordinary text keep their original identity', () => {
  const input = [block([span('Custom reference', 's', ['manual'])], [{_type: 'link', _key: 'manual', href: 'https://example.com'}])]
  assert.strictEqual(linkifyPortableText(input), input)
  const plain = [block([span('Just a reference without a web address')])]
  assert.strictEqual(linkifyPortableText(plain), plain)
})

test('references inside a layout row are linked while image cells stay untouched', () => {
  const image = {_type: 'image', _key: 'image'}
  const input: any[] = [{_type: 'layoutRow', _key: 'row', items: [
    {_type: 'layoutCell', _key: 'text', body: [block([span('Available at: https://example.com')])]},
    {_type: 'layoutCell', _key: 'photo', body: [image]},
  ]}]
  const output = linkifyPortableText(input)!
  assert.equal(output[0].items[0].body[0].markDefs[0].href, 'https://example.com')
  assert.strictEqual(output[0].items[1], input[0].items[1])
  assert.strictEqual(linkifyPortableText(output), output)
})
