import assert from 'node:assert/strict'
import {test} from 'node:test'
import {OWN_PROJECT_SOURCES, parseChangelog, fetchOwnProjectUpdates} from '../src/lib/ownProjectUpdates'

const hurbet = OWN_PROJECT_SOURCES[0]
const datedChangelog = `# Changelog

## 2026-09-24
- Repository created on GitHub.

## 2026-09-25
- Completed token embeddings.

## 2026-10-05
- Completed Chapter 3.3.1 from the tutorial series I managed to make A Simple Self-Attention Mechanism
`

test('HurbetAI calendar headings retain complete dates and distinct update identities', () => {
  const entries = parseChangelog(hurbet, datedChangelog.replace(/\n/g, '\r\n'))
  assert.deepEqual(entries.map((entry) => entry.date), ['2026-09-24', '2026-09-25', '2026-10-05'])
  assert.equal(new Set(entries.map((entry) => entry.id)).size, 3)
  assert.equal(entries[2].title, 'Herbet AI')
  assert.match(entries[2].summary, /Self-Attention Mechanism/)
  assert.equal(entries[2].href, 'https://github.com/KingOwen2006/HurbetAI/blob/main/CHANGELOG.md')
})

test('version headings, prerelease hyphens and reference links remain supported', () => {
  const entries = parseChangelog(hurbet, `## [1.0.0-beta.1] - 2026-10-05
- **New feature** shipped.
## 0.9.0 — 2026-09-25
- Earlier feature.
## [Unreleased]
- Work in progress.
[1.0.0-beta.1]: https://github.com/example/release`)
  assert.deepEqual(entries.map((entry) => entry.date), ['2026-10-05', '2026-09-25'])
  assert.equal(entries[0].title, 'Herbet AI 1.0.0-beta.1')
  assert.equal(entries[0].href, 'https://github.com/example/release')
  assert.equal(entries[0].summary, 'New feature shipped.')
})

test('fetch pipeline includes the latest dated update and sorts it before older entries', async (context) => {
  context.mock.method(Date, 'now', () => Date.parse('2026-10-05T18:00:00Z'))
  context.mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const url = String(input)
    if (url.includes('/HurbetAI/') && url.endsWith('/CHANGELOG.md')) return new Response(datedChangelog)
    return new Response('[]', {headers: {'Content-Type': 'application/json'}})
  })
  const entries = await fetchOwnProjectUpdates()
  assert.equal(entries[0].date, '2026-10-05')
  assert.equal(entries[0].projectId, hurbet.id)
  assert.equal(entries.filter((entry) => entry.projectId === hurbet.id).length, 3)
})
