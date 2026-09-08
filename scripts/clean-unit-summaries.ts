import {createClient} from '@sanity/client'
import {cleanWordPressText} from '../src/lib/cleanText.ts'

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const units = await client.fetch<Array<{_id: string; title: string; summary?: string}>>(
  `*[_type == "unit"]{_id, title, summary}`,
)

let updated = 0

for (const unit of units) {
  if (!unit.summary) continue
  const cleaned = cleanWordPressText(unit.summary)
  if (cleaned === unit.summary) continue

  await client.patch(unit._id).set({summary: cleaned}).commit()
  updated += 1
  console.log(`Updated: ${unit.title}`)
}

console.log(`Cleaned ${updated} unit summaries.`)
