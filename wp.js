(function () {
  "use strict";

  /* ======================
     SITE REGISTRY
     Central source of truth for WordPress API endpoints.
     Add new sites here — everything else references by key.
  ====================== */
  const WP_SITES = {
    edu:      "https://public-api.wordpress.com/wp/v2/sites/kingowenfyi.wordpress.com",
    projects: "https://public-api.wordpress.com/wp/v2/sites/kingowenblog.wordpress.com"
  };

  /* ======================
     EMBED REGISTRY
     Extensible pattern→HTML replacement system.
     Call window.koWp.registerEmbed(pattern, htmlOrFn) to add entries
     from outside this file.
  ====================== */
  const EMBED_REGISTRY = [];

  function registerEmbed(pattern, htmlOrFn) {
    EMBED_REGISTRY.push({
      pattern,
      getHtml: typeof htmlOrFn === "function" ? htmlOrFn : () => htmlOrFn
    });
  }

  function embedBlock(iframeSrc, linkText) {
    const figmaUrl = iframeSrc.replace("embed.figma.com", "www.figma.com").split("?")[0];
    const href = iframeSrc.includes("figma.com") ? figmaUrl : iframeSrc.replace("&embed=true", "");
    return `<div class="figma-wrapper">
      <iframe src="${iframeSrc}"></iframe>
      <a href="${href}" target="_blank" rel="noopener" class="embed-mobile-link">${linkText}</a>
    </div>`;
  }

  function modelEmbedBlock(modelSrc, altText, linkText) {
    return `<div class="figma-wrapper model-viewer-wrapper" data-ko-embed="model">
      <div class="glb-viewer" data-glb-viewer data-src="${modelSrc}">
        <canvas class="glb-viewer__canvas"></canvas>
      </div>
      <a href="${modelSrc}" target="_blank" rel="noopener" download class="embed-mobile-link">${linkText}</a>
    </div>`;
  }

  registerEmbed("Interactive-Ship-Here", () => modelEmbedBlock("Models/Unit3ShipDone.glb", "Unit 3 Ship Model", "View / Download Ship Model"));
  registerEmbed("Unit1-moodboard1-here", () => embedBlock("https://embed.figma.com/board/F0BfcSQpK4EtYVEtlb9lwV/Mood-Board?node-id=0-1&embed-host=share", "Open Mood Board in Figma"));
  registerEmbed("Unit1-moodboard2-here", () => embedBlock("https://embed.figma.com/board/nj3rvRhnhGHPoojzJFonxh/Cannon-Board?embed-host=share", "Open Cannon Board in Figma"));
  registerEmbed("Unit1-form-here", () => embedBlock("https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUOFRVVUhTMUswUzBEWTBVTjQzQzY5NVJWWS4u&embed=true", "Open Form"));
  registerEmbed("Unit1-formANS-here", () => embedBlock("https://forms.cloud.microsoft/Pages/AnalysisPage.aspx?AnalyzerToken=GWhIwVOBfSGiYbBrbwU8McqYnS87Sl6e&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUOFRVVUhTMUswUzBEWTBVTjQzQzY5NVJWWS4u", "Open Form Analysis"));
  registerEmbed("Unit2-form-here", () => embedBlock("https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUNFVHSVU4VzRCMlVNTTExOUFONTNYRjBJMC4u&embed=true", "Open Form"));
  registerEmbed("Unit2-formANS-here", () => embedBlock("https://forms.cloud.microsoft/Pages/AnalysisPage.aspx?AnalyzerToken=NbUyeN4dPXxMzyc26vZW5IeiKhlXnoAO&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUNFVHSVU4VzRCMlVNTTExOUFONTNYRjBJMC4u", "Open Form Analysis"));
  registerEmbed("Unit4-moodboard-here", () => embedBlock("https://embed.figma.com/board/vC87CfHAXm2Hl2MSUYLsQa/Twine-Mood-board?node-id=0-1&embed-host=share", "Open Twine Mood Board in Figma"));
  registerEmbed("Unit4-form-here", () => embedBlock("https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUN09ZNUZRVTNZODZJSlJBTDA0QThDREtIRS4u&embed=true", "Open Form"));
  registerEmbed("Unit4-formANS-here", () => embedBlock("https://forms.cloud.microsoft/Pages/AnalysisPage.aspx?AnalyzerToken=IqfQOSxrfkVAFynsgvV5N4Dns5EQYF1f&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUN09ZNUZRVTNZODZJSlJBTDA0QThDREtIRS4u", "Open Form Analysis"));

  registerEmbed("Work-Experience-Map", () => embedBlock("https://www.google.com/maps/embed?pb=!4v1770816542856!6m8!1m7!1sSlCTbzOTgMlRwwJruK02IA!2m2!1d52.337225584726!2d-1.290510821010784!3f309.69961632594993!4f-13.516772291120219!5f0.7820865974627469", "Open Map"));

  function replaceEmbeds(content) {
    for (const entry of EMBED_REGISTRY) {
      if (content.includes(entry.pattern)) {
        content = content.replaceAll(entry.pattern, entry.getHtml());
      }
    }
    return content;
  }

  /* ======================
     INLINE LOADER
  ====================== */
  function showLoader(container, text) {
    if (!container) return;
    container.innerHTML = `
      <div class="ko-wp-inline-loader" role="status" aria-live="polite">
        <div class="ko-wp-inline-loader__card">
          <div class="ko-wp-inline-loader__row">
            <div><div class="ko-wp-inline-loader__text">${String(text || "Loading\u2026")}</div></div>
          </div>
          <div class="ko-wp-inline-loader__bar" aria-hidden="true"></div>
        </div>
      </div>`;
  }

  function hideLoader(container) {
    if (!container) return;
    const el = container.querySelector(".ko-wp-inline-loader");
    if (el) el.remove();
  }

  /* ======================
     URL HELPERS
     Works on file:, localhost:3000, and deployed.
     - file: / localhost → use .html?slug= (no server config needed)
     - deployed → use /post/slug (clean URLs when server supports it)
  ====================== */
  function isLocalOrDev() {
    if (window.location.protocol === "file:") return true;
    const h = window.location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "";
  }

  function buildPostUrl(linkPage, slug, extraParams) {
    const params = new URLSearchParams(extraParams || {});
    params.set("slug", slug);
    if (isLocalOrDev()) {
      return `${linkPage}.html?${params}`;
    }
    const qs = params.toString();
    return `/${linkPage}/${slug}${qs ? "?" + qs : ""}`;
  }

  function getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  function getSlugFromPath() {
    const segments = window.location.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;
    const base = segments[0];
    if (base !== "post" && base !== "blog") return null;
    return segments.slice(1).join("/");
  }

  /* ======================
     FETCH (with cache)
  ====================== */
  const fetchCache = new Map();

  function wpFetch(url) {
    if (fetchCache.has(url)) return fetchCache.get(url);
    const promise = fetch(url)
      .then(res => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .catch(err => { fetchCache.delete(url); throw err; });
    fetchCache.set(url, promise);
    return promise;
  }

  function fetchPosts(siteKey, perPage) {
    const api = WP_SITES[siteKey];
    if (!api) return Promise.reject(new Error("Unknown site: " + siteKey));
    return wpFetch(`${api}/posts?_embed&per_page=${perPage || 100}`);
  }

  function fetchPostBySlug(siteKey, slug) {
    const api = WP_SITES[siteKey];
    if (!api) return Promise.reject(new Error("Unknown site: " + siteKey));
    return wpFetch(`${api}/posts?slug=${encodeURIComponent(slug)}&_embed`)
      .then(posts => { if (!posts.length) throw new Error("Not found"); return posts[0]; });
  }

  function fetchPostById(siteKey, id) {
    const api = WP_SITES[siteKey];
    if (!api) return Promise.reject(new Error("Unknown site: " + siteKey));
    return wpFetch(`${api}/posts/${encodeURIComponent(id)}?_embed`);
  }

  /* ======================
     POST PROCESSING
  ====================== */
  function getWordCount(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    tmp.querySelectorAll("iframe, img, video, audio, figure, script, style").forEach(el => el.remove());
    const refs = [...tmp.querySelectorAll("h1, h2, h3")].find(h => h.textContent.trim().toLowerCase() === "references");
    if (refs) { let n = refs; while (n) { const nx = n.nextSibling; n.remove(); n = nx; } }
    return (tmp.textContent || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function rehydrateFigma(scope) {
    (scope || document).querySelectorAll("iframe[src*='figma.com']").forEach(old => {
      old.replaceWith(old.cloneNode(true));
    });
  }

  function enhanceImageCompare(scope) {
    const figures = (scope || document).querySelectorAll("figure.wp-block-jetpack-image-compare");
    figures.forEach((figure, index) => {
      const juxtapose = figure.querySelector(".juxtapose");
      const imgs = (juxtapose || figure).querySelectorAll("img");
      if (imgs.length < 2) return;

      const before = imgs[0].cloneNode(true);
      const after = imgs[1].cloneNode(true);
      before.removeAttribute("id");
      after.removeAttribute("id");
      before.draggable = false;
      after.draggable = false;
      if (!before.getAttribute("alt")) before.setAttribute("alt", "Before image");
      if (!after.getAttribute("alt")) after.setAttribute("alt", "After image");

      const caption = figure.querySelector("figcaption");
      const wrapper = document.createElement("figure");
      wrapper.className = "ko-compare";
      wrapper.style.setProperty("--pos", "50%");
      wrapper.dataset.compareIndex = String(index);

      const viewport = document.createElement("div");
      viewport.className = "ko-compare__viewport";
      before.classList.add("ko-compare__img", "ko-compare__img--before");
      after.classList.add("ko-compare__img", "ko-compare__img--after");

      const handle = document.createElement("div");
      handle.className = "ko-compare__handle";
      handle.setAttribute("aria-hidden", "true");

      const sync = v => wrapper.style.setProperty("--pos", `${Math.max(0, Math.min(100, Number(v)))}%`);
      const fromPointer = cx => { const r = viewport.getBoundingClientRect(); sync(Math.round(((cx - r.left) / r.width) * 100)); };
      const onMove = e => fromPointer(e.clientX);
      const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
      viewport.addEventListener("pointerdown", e => {
        if (e.target?.closest?.("a")) return;
        fromPointer(e.clientX);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      });

      viewport.appendChild(before);
      viewport.appendChild(after);
      viewport.appendChild(handle);
      wrapper.appendChild(viewport);
      if (caption) wrapper.appendChild(caption);
      figure.replaceWith(wrapper);
    });
  }

  function postProcess(scope) {
    enhanceImageCompare(scope);
    rehydrateFigma(scope);
    if (window.koLightbox) window.koLightbox.wrapEmbeds(scope);
    if (window.initGlbViewers) window.initGlbViewers(scope);
  }

  /* ======================
     SORT HELPER
  ====================== */
  function sortByTitle(posts) {
    return posts.sort((a, b) =>
      a.title.rendered.localeCompare(b.title.rendered, undefined, { numeric: true, sensitivity: "base" })
    );
  }

  /* ======================
     RENDERERS
     Each produces the exact same HTML as the original layout.
  ====================== */

  function renderSinglePost(container, post) {
    const processed = replaceEmbeds(post.content.rendered);
    const words = getWordCount(processed);
    container.innerHTML = `
      <h1>${post.title.rendered}</h1>
      <p class="word-count">Word count: ${words}</p>
      <div class="post-content">${processed}</div>
    `;
    postProcess(container);
  }

  function renderListCards(container, posts, linkPage, linkParams) {
    container.innerHTML = posts.map(p => {
      const img = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
      const href = buildPostUrl(linkPage, p.slug, linkParams);
      return `
        <a href="${href}" class="post-card">
          ${img ? `<img src="${img}" alt="${p.title.rendered}">` : ""}
          <h3>${p.title.rendered}</h3>
          <p>${p.excerpt.rendered.replace(/<[^>]+>/g, "")}</p>
          <span>Read more →</span>
        </a>`;
    }).join("");
  }

  function renderRoadCards(container, posts, linkPage, linkParams) {
    container.innerHTML = posts.map(p => {
      const img = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
      const href = buildPostUrl(linkPage, p.slug, linkParams);
      const excerpt = p.excerpt.rendered.replace(/<[^>]+>/g, "").trim();
      const cats = (p._embedded?.["wp:term"]?.[0] || []).map(c => c.name);
      const tags = (p._embedded?.["wp:term"]?.[1] || []).map(t => t.name);
      const allTags = [...cats, ...tags];
      return `
        <div class="road-post">
          <a href="${href}" class="road-card">
            ${img ? `<img class="road-card__img" src="${img}" alt="${p.title.rendered}" loading="lazy" draggable="false">` : ""}
            <div class="road-card__body">
              ${allTags.length ? `<div class="road-card__tags">${allTags.map(t => `<span class="road-card__tag">${t}</span>`).join("")}</div>` : ""}
              <div class="road-card__title">${p.title.rendered}</div>
              <div class="road-card__excerpt">${excerpt}</div>
              <span class="road-card__more">Read more →</span>
            </div>
          </a>
        </div>`;
    }).join("");
  }

  /* ======================
     SCROLL REVEAL
     Shared IntersectionObserver for road-post cards.
  ====================== */
  const roadObserver = typeof IntersectionObserver !== "undefined"
    ? new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
      }, { threshold: 0.15 })
    : null;

  function observeRoadPosts(container) {
    container.querySelectorAll(".road-post").forEach(el => {
      if (roadObserver) roadObserver.observe(el);
      else el.classList.add("visible");
    });
  }

  /* ======================
     AUTO-INIT: FEEDS
     Scans for elements with [data-wp-feed] and loads data.

     HTML contract:
       data-wp-feed="edu|projects"    — site key
       data-wp-layout="road|list"     — render mode
       data-wp-link-page="post"       — target page for links
       data-wp-link-params="site=projects" — extra query params for links (optional)
  ====================== */
  function initFeeds() {
    document.querySelectorAll("[data-wp-feed]").forEach(container => {
      const siteKey   = container.dataset.wpFeed;
      const layout    = container.dataset.wpLayout || "road";
      const linkPage  = container.dataset.wpLinkPage || "post";
      const rawParams = container.dataset.wpLinkParams || "";

      const linkParams = {};
      if (rawParams) new URLSearchParams(rawParams).forEach((v, k) => { linkParams[k] = v; });

      fetchPosts(siteKey)
        .then(posts => {
          sortByTitle(posts);
          if (layout === "list") {
            renderListCards(container, posts, linkPage, linkParams);
          } else {
            renderRoadCards(container, posts, linkPage, linkParams);
            observeRoadPosts(container);
          }
        })
        .catch(() => {
          container.innerHTML = `<p style="text-align:center;color:#8899aa;">Failed to load posts.</p>`;
        });
    });
  }

  /* ======================
     AUTO-INIT: SINGLE POST
     Scans for elements with [data-wp-post] and loads the post
     identified by the current URL.

     HTML contract:
       data-wp-post                   — marks this as a single-post container
       data-wp-default-site="edu"     — fallback site key
  ====================== */
  function initSinglePost() {
    const container = document.querySelector("[data-wp-post]");
    if (!container) return;

    const defaultSite = container.dataset.wpDefaultSite || "edu";
    const siteKey     = getParam("site") || defaultSite;
    const slug        = getSlugFromPath() || getParam("slug");
    const id          = getParam("id");

    if (!slug && !id) {
      const homeHref = isLocalOrDev() ? "index.html" : "/";
      container.innerHTML = `
        <p style="text-align:center;color:var(--text-muted);margin:2rem 0;">
          No post selected. <a href="${homeHref}" style="color:var(--accent);">Choose a post from the home page</a>.
        </p>`;
      return;
    }

    showLoader(container, "Loading\u2026");

    const promise = slug
      ? fetchPostBySlug(siteKey, slug)
      : fetchPostById(siteKey, id);

    promise
      .then(post => renderSinglePost(container, post))
      .catch((err) => {
        console.error("WP load error:", err);
        container.innerHTML = `<p style="text-align:center;color:var(--text-muted);">Failed to load post. <a href="${isLocalOrDev() ? "index.html" : "/"}" style="color:var(--accent);">Back to home</a>.</p>`;
      })
      .finally(() => hideLoader(container));
  }

  /* ======================
     SPA FALLBACK REDIRECT
     When server serves index.html for /post/slug (common with historyApiFallback),
     redirect to post.html?slug=... so the correct page loads.
  ====================== */
  function maybeRedirectFromSpaFallback() {
    const pathname = window.location.pathname;
    const match = pathname.match(/^\/(post|blog)\/(.+)$/);
    if (!match) return;
    const [, page, slug] = match;
    const hasPostContainer = document.querySelector("[data-wp-post]");
    if (hasPostContainer) return;
    const params = new URLSearchParams(window.location.search);
    params.set("slug", slug);
    const newUrl = `${window.location.origin}/${page}.html?${params}`;
    window.location.replace(newUrl);
  }

  /* ======================
     BOOT
  ====================== */
  function init() {
    maybeRedirectFromSpaFallback();
    initFeeds();
    initSinglePost();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  /* ======================
     PUBLIC API
  ====================== */
  window.koWp = {
    sites: WP_SITES,
    registerEmbed,
    showLoader,
    hideLoader
  };
})();
