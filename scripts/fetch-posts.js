#!/usr/bin/env node
/**
 * Fetches posts from WordPress API and saves to data/ folder.
 * Run: node scripts/fetch-posts.js
 * Requires: Node.js (no extra deps)
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const APIS = {
  edu: "https://public-api.wordpress.com/wp/v2/sites/kingowenfyi.wordpress.com",
  projects: "https://public-api.wordpress.com/wp/v2/sites/kingowenblog.wordpress.com"
};

const DATA_DIR = path.join(__dirname, "..", "data");

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  for (const [name, base] of Object.entries(APIS)) {
    const url = `${base}/posts?_embed&per_page=100`;
    try {
      const posts = await fetch(url);
      const out = path.join(DATA_DIR, `${name}-posts.json`);
      fs.writeFileSync(out, JSON.stringify(posts, null, 2), "utf8");
      console.log(`Saved ${posts.length} posts to ${path.basename(out)}`);
    } catch (err) {
      console.error(`Failed to fetch ${name}:`, err.message);
    }
  }
}

main();
