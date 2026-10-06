import assert from 'node:assert/strict'
import {test} from 'node:test'
import {editableRow, moveIntoLayout, type LayoutBlock} from './rows'
import {countPortableTextWords} from '../../../src/lib/wordCount'
import {toWritableDocument} from '../../api/_lib/handlers'

const image = (key: string): LayoutBlock => ({_type: 'image', _key: key,
  asset: {_type: 'reference', _ref: `image-${key}`}, alt: key, caption: 'Caption'})
const text: LayoutBlock = {_type: 'block', _key: 'text', style: 'h3',
  markDefs: [{_type: 'link', _key: 'link', href: 'https://example.com'}],
  children: [{_type: 'span', _key: 'span', text: 'Two words', marks: ['strong', 'link']}]}
let key = 0
const makeKey = () => `generated-${++key}`
const order = (row: LayoutBlock) => row.items!.flatMap((cell) => cell.body.map((block) => block._key))

for (const side of ['left', 'right'] as const) {
  test(`image ${side} of text preserves formatting and image metadata`, () => {
    const blocks = [text, image('one')]
    const result = moveIntoLayout(blocks, {blockKey: 'one'}, {blockKey: 'text'}, side, makeKey)
    assert.equal(result.length, 1)
    assert.deepEqual(order(result[0]), side === 'left' ? ['one', 'text'] : ['text', 'one'])
    assert.deepEqual(result[0].items!.flatMap((cell) => cell.body).find((block) => block._key === 'text'), text)
    assert.deepEqual(blocks, [text, image('one')])
    assert.equal(countPortableTextWords(result), 2)
  })
}

test('image next to image makes a row', () => {
  const result = moveIntoLayout([image('one'), image('two')], {blockKey: 'two'}, {blockKey: 'one'}, 'right', makeKey)
  assert.deepEqual(order(result[0]), ['one', 'two'])
})

test('move within a row keeps stable cell identities without duplicating content', () => {
  const [row] = moveIntoLayout([text, image('one')], {blockKey: 'one'}, {blockKey: 'text'}, 'left', makeKey)
  const cells = row.items!
  const [result] = moveIntoLayout([row], {blockKey: row._key, cellKey: cells[0]._key},
    {blockKey: row._key, cellKey: cells[1]._key}, 'right', makeKey)
  assert.deepEqual(order(result), ['text', 'one'])
  assert.deepEqual(result.items!.map((cell) => cell._key), [cells[1]._key, cells[0]._key])
})

test('moving an item to another row collapses the source row', () => {
  const [row] = moveIntoLayout([text, image('one')], {blockKey: 'one'}, {blockKey: 'text'}, 'left', makeKey)
  const result = moveIntoLayout([row, image('two')], {blockKey: row._key, cellKey: row.items![0]._key},
    {blockKey: 'two'}, 'right', makeKey)
  assert.deepEqual(result[0], text)
  assert.deepEqual(order(result[1]), ['two', 'one'])
})

test('moving a row item above its row restores standalone content', () => {
  const [row] = moveIntoLayout([text, image('one')], {blockKey: 'one'}, {blockKey: 'text'}, 'left', makeKey)
  const result = moveIntoLayout([row], {blockKey: row._key, cellKey: row.items![0]._key},
    {blockKey: row._key}, 'before', makeKey)
  assert.deepEqual(result, [image('one'), text])
})

test('self drops and stale locations are no-ops', () => {
  const blocks = [text, image('one')]
  assert.equal(moveIntoLayout(blocks, {blockKey: 'one'}, {blockKey: 'one'}, 'left', makeKey), blocks)
  assert.equal(moveIntoLayout(blocks, {blockKey: 'missing'}, {blockKey: 'one'}, 'right', makeKey), blocks)
})

test('uploaded images can be inserted beside existing text', () => {
  const [row] = moveIntoLayout([text], [image('uploaded')], {blockKey: 'text'}, 'right', makeKey)
  assert.deepEqual(order(row), ['text', 'uploaded'])
})

test('legacy image rows gain drag reordering without losing image fields', () => {
  const legacy: LayoutBlock = {_type: 'imageRow', _key: 'legacy', images: [image('one'), image('two')]}
  const row = editableRow(legacy)
  const [result] = moveIntoLayout([legacy], {blockKey: 'legacy', cellKey: row.items![1]._key},
    {blockKey: 'legacy', cellKey: row.items![0]._key}, 'left', makeKey)
  assert.deepEqual(order(result), ['two', 'one'])
  assert.deepEqual(result.items![0].body[0], image('two'))
})

test('saving rows converts expanded image assets back into Sanity references', () => {
  const expanded = {...image('one'), asset: {_id: 'image-one', url: 'https://example.com/image.png'}}
  const [row] = moveIntoLayout([text, expanded], {blockKey: 'one'}, {blockKey: 'text'}, 'right', makeKey)
  const saved = toWritableDocument('unit', {body: [row]}).body as LayoutBlock[]
  assert.deepEqual(saved[0].items![1].body[0].asset, {_type: 'reference', _ref: 'image-one'})
  assert.deepEqual(saved[0].items![0].body[0], text)
})

const stackedRow = (): LayoutBlock => ({_type: 'layoutRow', _key: 'row', items: [
  {_type: 'layoutCell', _key: 'left', body: [image('one'), image('two')]},
  {_type: 'layoutCell', _key: 'right', body: [text]},
]})

test('drop below a block adds to its column without adding a column', () => {
  const row = stackedRow()
  const [result] = moveIntoLayout([row, image('three')], {blockKey: 'three'},
    {blockKey: 'row', cellKey: 'right', childKey: 'text'}, 'after', makeKey)
  assert.equal(result.items!.length, 2)
  assert.deepEqual(result.items![1].body, [text, image('three')])
  assert.deepEqual(row, stackedRow())
})

test('blocks reorder inside a column while retaining their formatting', () => {
  const [result] = moveIntoLayout([stackedRow()], {blockKey: 'row', cellKey: 'left', childKey: 'two'},
    {blockKey: 'row', cellKey: 'left', childKey: 'one'}, 'before', makeKey)
  assert.deepEqual(result.items![0].body, [image('two'), image('one')])
})

test('a single block moves between columns without moving its siblings', () => {
  const [result] = moveIntoLayout([stackedRow()], {blockKey: 'row', cellKey: 'left', childKey: 'two'},
    {blockKey: 'row', cellKey: 'right'}, 'after', makeKey)
  assert.deepEqual(result.items![0].body, [image('one')])
  assert.deepEqual(result.items![1].body, [text, image('two')])
})

test('moving a block out of a stacked column preserves the remaining row', () => {
  const [row, moved] = moveIntoLayout([stackedRow()], {blockKey: 'row', cellKey: 'left', childKey: 'two'},
    {blockKey: 'row'}, 'after', makeKey)
  assert.deepEqual(row.items![0].body, [image('one')])
  assert.deepEqual(moved, image('two'))
})

test('empty columns are removed after moving their last block', () => {
  const result = moveIntoLayout([stackedRow()], {blockKey: 'row', cellKey: 'right', childKey: 'text'},
    {blockKey: 'row', cellKey: 'left', childKey: 'two'}, 'after', makeKey)
  assert.deepEqual(result, [image('one'), image('two'), text])
})

test('stale child locations and unsupported column blocks are no-ops', () => {
  const blocks = [stackedRow(), {_type: 'unitEmbed', _key: 'embed'}]
  assert.equal(moveIntoLayout(blocks, {blockKey: 'row', cellKey: 'left', childKey: 'missing'},
    {blockKey: 'row', cellKey: 'right'}, 'after', makeKey), blocks)
  assert.equal(moveIntoLayout(blocks, {blockKey: 'embed'},
    {blockKey: 'row', cellKey: 'right'}, 'after', makeKey), blocks)
})
