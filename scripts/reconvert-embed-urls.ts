/**
 * Re-scan all Sanity unit bodies and convert embeddable URLs/phrases to unitEmbed blocks.
 *
 * Usage:
 *   npm run reconvert:embeds
 */

import {createClient} from '@sanity/client'
import {convertPhraseEmbedsInBody, type PortableTextBodyItem} from '../src/lib/portableTextEmbeds.ts'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2025-01-01',
  useCdn: false,
})

type UnitDoc = {
  _id: string
  title?: string
  body?: PortableTextBodyItem[]
}

async function main() {
  const units = await client.fetch<UnitDoc[]>(
    `*[_type == "unit" && defined(body) && !defined(trashedAt)]{ _id, title, body }`,
  )

  let updated = 0

  for (const unit of units) {
    const converted = convertPhraseEmbedsInBody(unit.body)
    if (!converted || JSON.stringify(converted) === JSON.stringify(unit.body)) continue

    await client.patch(unit._id).set({body: converted}).commit()
    updated += 1
    console.log(`Updated: ${unit.title ?? unit._id}`)
  }

  console.log(`Reconverted embeds in ${updated}/${units.length} units.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
