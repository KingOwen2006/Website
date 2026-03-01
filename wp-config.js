/* ======================
   WORDPRESS / DATA SOURCE CONFIG
   Edit this file to switch between remote API and local JSON.
   ====================== */
window.KO_WP_CONFIG = {
  /* Data source: "auto" | "remote" | "local"
     - auto:   Try WordPress API first, fall back to local JSON on failure
     - remote: Use WordPress API only (requires http/https, fails on file://)
     - local:  Use local JSON files only (works offline, localhost, and deployed)
  */
  dataSource: "auto",

  /* WordPress.com API endpoints (used when dataSource is "auto" or "remote") */
  apis: {
    edu: "https://public-api.wordpress.com/wp/v2/sites/kingowenfyi.wordpress.com",
    projects: "https://public-api.wordpress.com/wp/v2/sites/kingowenblog.wordpress.com"
  },

  /* Local JSON paths (used when dataSource is "local" or as fallback)
     Relative to the HTML file. Works with file://, localhost, and deployed.
  */
  localData: {
    edu: "data/edu-posts.json",
    projects: "data/projects-posts.json"
  }
};
