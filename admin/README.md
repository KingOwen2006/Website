# KingOwen Admin

WordPress-style CMS for the portfolio site. Sanity stays the content backend (`bxr88bn5` / `production`); this app is the editor UI.

## Local development

1. Copy `admin/.env.example` to `admin/.env` (repo-root `.env` is also loaded).
2. Set `SANITY_API_TOKEN`, `ADMIN_PASSWORD`, and `SESSION_SECRET`.
3. From the repo root: `npm run admin`
4. Open http://localhost:3333 and sign in with `ADMIN_PASSWORD`.

The write token never ships to the browser. Vite proxies `/api/*` to local handlers that call Sanity with `SANITY_API_TOKEN`.

## Beta portfolio

The beta branch builds the public portfolio and this editor together. The portfolio is at `/`, coursework is at `/education/`, and the editor is at `/admin/`. The post settings link public units to their Education pages.

From the repository root:

```sh
npm ci --legacy-peer-deps
npm ci --prefix admin --legacy-peer-deps
npm ci --prefix portfolio
npm run build:beta
npm run preview:beta
```

For local editing, put the credentials from [the admin environment template](.env.example) in an ignored `admin/.env` or root `.env`. For hosted beta editing, configure `SANITY_API_TOKEN`, `ADMIN_PASSWORD`, and `SESSION_SECRET` in the Vercel environment for that branch. Use a Sanity token with write access to the same dataset the portfolio reads. The public Education endpoint reads published content without the token.

## Deploy

The standalone admin Vercel project uses [`vercel.admin.json`](../vercel.admin.json). The combined beta build uses [`vercel.json`](../vercel.json). Set:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_TOKEN`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

Stop using `sanity deploy` for hosted Studio; this app replaces it.

## Schema and types

Schema lives in [`../sanity`](../sanity). Deploy with `npm run schema:deploy`. Regenerate types with `npm run typegen`.

## Adding custom blocks

Register a block from any admin module:

```ts
import {registerBlock} from './editor/extensions'

registerBlock({
  type: 'callout',
  label: 'Callout',
  description: 'Highlighted note',
  aliases: ['callout', 'note'],
  category: 'text',
  icon: '!',
  kind: 'block',
})
```

Then add the matching Sanity object type, Portable Text editor schema entry, `ObjectBlock` editor UI, and a renderer in `src/components/experience/PortableTextRenderer.tsx`.

## Adding SEO checks or sidebar panels

```ts
import {registerSeoCheck, registerSidebarPanel} from './editor/extensions'

registerSeoCheck((post) => ({
  id: 'custom',
  label: 'Custom check',
  status: post.title ? 'good' : 'bad',
  detail: 'Example extension',
}))

registerSidebarPanel({
  id: 'notes',
  label: 'Notes',
  render: ({post}) => <p>{post.title}</p>,
})
```
