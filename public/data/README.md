# Local post data

These JSON files are used when:
- **dataSource: "local"** in `wp-config.js` — always use local data
- **dataSource: "auto"** — fallback when the WordPress API is unreachable

## Format

Each file must be an array of WordPress-style post objects. Example:

```json
[
  {
    "id": 1,
    "slug": "unit-1-post",
    "title": { "rendered": "Unit 1 Post" },
    "content": { "rendered": "<p>Post content here...</p>" },
    "excerpt": { "rendered": "<p>Short excerpt</p>" },
    "_embedded": {
      "wp:featuredmedia": [{ "source_url": "https://example.com/image.jpg" }],
      "wp:term": [[], []]
    }
  }
]
```

## Export from WordPress

Run this in the browser console to fetch and copy JSON:

```javascript
// Education posts
fetch("https://public-api.wordpress.com/wp/v2/sites/kingowenfyi.wordpress.com/posts?_embed&per_page=100")
  .then(r=>r.json()).then(d=>console.log(JSON.stringify(d, null, 2)));

// Projects posts
fetch("https://public-api.wordpress.com/wp/v2/sites/kingowenblog.wordpress.com/posts?_embed&per_page=100")
  .then(r=>r.json()).then(d=>console.log(JSON.stringify(d, null, 2)));
```

Copy the output and save to `edu-posts.json` or `projects-posts.json`.
