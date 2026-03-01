(function () {
  /* ======================
     CONFIG (from wp-config.js or defaults)
  ====================== */
  const CFG = window.KO_WP_CONFIG || {};
  const DATA_SOURCE = CFG.dataSource || "auto";
  const APIS = CFG.apis || {
    edu: "https://public-api.wordpress.com/wp/v2/sites/kingowenfyi.wordpress.com",
    projects: "https://public-api.wordpress.com/wp/v2/sites/kingowenblog.wordpress.com"
  };
  const LOCAL_DATA = CFG.localData || {
    edu: "data/edu-posts.json",
    projects: "data/projects-posts.json"
  };

  function resolveUrl(path) {
    try {
      return new URL(path, window.location.href).href;
    } catch (_) {
      return path;
    }
  }

  function fetchJson(url) {
    return fetch(url, { mode: "cors" }).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
  }

  async function fetchPostsWithFallback(apiUrl, localPath) {
    const localUrl = resolveUrl(localPath);
    if (DATA_SOURCE === "local") {
      return fetchJson(localUrl);
    }
    if (DATA_SOURCE === "remote") {
      return fetchJson(apiUrl + "/posts?_embed&per_page=100");
    }
    try {
      return await fetchJson(apiUrl + "/posts?_embed&per_page=100");
    } catch (err) {
      console.warn("WordPress API failed, trying local fallback:", err.message);
      return fetchJson(localUrl);
    }
  }

  async function fetchPostBySlugWithFallback(apiUrl, localPath, slug) {
    const localUrl = resolveUrl(localPath);
    if (DATA_SOURCE === "local") {
      const posts = await fetchJson(localUrl);
      const found = Array.isArray(posts) ? posts.find((p) => p.slug === slug) : null;
      if (!found) throw new Error("Post not found");
      return found;
    }
    if (DATA_SOURCE === "remote") {
      const res = await fetch(apiUrl + "/posts?slug=" + encodeURIComponent(slug) + "&_embed", { mode: "cors" });
      if (!res.ok) throw new Error("Post not found");
      const posts = await res.json();
      if (!posts || !posts.length) throw new Error("Post not found");
      return posts[0];
    }
    try {
      const res = await fetch(apiUrl + "/posts?slug=" + encodeURIComponent(slug) + "&_embed", { mode: "cors" });
      if (!res.ok) throw new Error("Post not found");
      const posts = await res.json();
      if (!posts || !posts.length) throw new Error("Post not found");
      return posts[0];
    } catch (err) {
      console.warn("WordPress API failed, trying local fallback:", err.message);
      const posts = await fetchJson(localUrl);
      const found = Array.isArray(posts) ? posts.find((p) => p.slug === slug) : null;
      if (!found) throw new Error("Post not found");
      return found;
    }
  }

  async function fetchPostByIdWithFallback(apiUrl, localPath, id) {
    const localUrl = resolveUrl(localPath);
    if (DATA_SOURCE === "local") {
      const posts = await fetchJson(localUrl);
      const found = Array.isArray(posts) ? posts.find((p) => String(p.id) === String(id)) : null;
      if (!found) throw new Error("Post not found");
      return found;
    }
    if (DATA_SOURCE === "remote") {
      const res = await fetch(apiUrl + "/posts/" + id + "?_embed", { mode: "cors" });
      if (!res.ok) throw new Error("Post not found");
      return res.json();
    }
    try {
      const res = await fetch(apiUrl + "/posts/" + id + "?_embed", { mode: "cors" });
      if (!res.ok) throw new Error("Post not found");
      return res.json();
    } catch (err) {
      console.warn("WordPress API failed, trying local fallback:", err.message);
      const posts = await fetchJson(localUrl);
      const found = Array.isArray(posts) ? posts.find((p) => String(p.id) === String(id)) : null;
      if (!found) throw new Error("Post not found");
      return found;
    }
  }

  /* ======================
     THEME (ALWAYS LOADS)
  ====================== */
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);

  function getEffectiveTheme() {
    const explicit = root.getAttribute("data-theme");
    if (explicit === "dark" || explicit === "light") return explicit;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  }

  function updateThemeToggleIcons(theme = getEffectiveTheme()) {
    document.querySelectorAll(".theme-toggle__icon").forEach((img) => {
      const lightSrc = img.getAttribute("data-light-src") || "SVG/tooglelight.svg";
      const darkSrc = img.getAttribute("data-dark-src") || "SVG/toogledark.svg";
      img.setAttribute("src", theme === "dark" ? darkSrc : lightSrc);
    });
  }

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  onReady(() => updateThemeToggleIcons());

  window.toggleTheme = function () {
    const isDark = root.getAttribute("data-theme") === "dark";
    const newTheme = isDark ? "light" : "dark";
    root.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeToggleIcons(newTheme);
  };

  /* ======================
     WORDPRESS LOADER
  ====================== */
  const KO_WP_LOADER_ID = "ko-wp-inline-loader";

  function getInlineLoaderHtml(text) {
    return `<div class="ko-wp-inline-loader" id="${KO_WP_LOADER_ID}" role="status" aria-live="polite">
      <div class="ko-wp-inline-loader__card">
        <div class="ko-wp-inline-loader__row"><div><div class="ko-wp-inline-loader__text">${String(text)}</div></div></div>
        <div class="ko-wp-inline-loader__bar" aria-hidden="true"></div>
      </div>
    </div>`;
  }

  function showWpLoaderIn(container, text) {
    if (container) container.innerHTML = getInlineLoaderHtml(text);
  }

  function hideWpLoaderIn(container) {
    if (container) {
      const el = container.querySelector("#" + KO_WP_LOADER_ID);
      if (el) el.remove();
    }
  }

  window.koWpLoader = { showIn: showWpLoaderIn, hideIn: hideWpLoaderIn };

  /* ======================
     PAGE → WORDPRESS MAP
  ====================== */
  const PAGE_CONFIG = {
    "projects.html": { apiKey: "projects", mode: "list", link: "blog" },
    "blog.html": { apiKey: "projects", mode: "single" },
    "edu.html": { apiKey: "edu", mode: "list", link: "post" },
    "post.html": { apiKey: "edu", mode: "single" },
    "index.html": { apiKey: "edu", mode: "road", link: "post" }
  };

  function getPageKey() {
    let path = window.location.pathname;
    if (window.location.protocol === "file:") {
      return path.split("/").pop() || "index.html";
    }
    if (path.endsWith("/")) path = path.slice(0, -1);
    const segments = path.split("/").filter(Boolean);
    if (!segments.length) return "index.html";
    if ((segments[0] === "blog" || segments[0] === "post") && segments.length >= 1) {
      return segments[0] + ".html";
    }
    let page = segments[segments.length - 1];
    if (!page.includes(".")) page += ".html";
    return page;
  }

  const page = getPageKey();
  const config = PAGE_CONFIG[page];

  if (!config) {
    console.warn("No config for page:", page);
    return;
  }

  const API_BASE = APIS[config.apiKey];
  const LOCAL_PATH = LOCAL_DATA[config.apiKey];
  const PROJECTS_API = APIS.projects;
  const PROJECTS_LOCAL = LOCAL_DATA.projects;

  const postContainer = document.getElementById("post");
  const postsContainer = document.getElementById("posts");
  const projectsPostsContainer = document.getElementById("projects-posts");

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  function getSlugFromPath() {
    const path = window.location.pathname;
    const segments = path.split("/").filter(Boolean);
    if (segments.length >= 2 && (segments[0] === "blog" || segments[0] === "post")) {
      return segments.slice(1).join("/");
    }
    return null;
  }

  const postSlug = getSlugFromPath() || params.get("slug");

  /* ======================
     EMBED REPLACEMENTS
  ====================== */
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

  function replaceEmbeds(content) {
    const replacements = {
      "Interactive-Ship-Here": modelEmbedBlock("Models/Unit3ShipDone.glb", "Unit 3 Ship Model", "View / Download Ship Model"),
      "Unit1-moodboard1-here": embedBlock("https://embed.figma.com/board/F0BfcSQpK4EtYVEtlb9lwV/Mood-Board?node-id=0-1&embed-host=share", "Open Mood Board in Figma"),
      "Unit1-moodboard2-here": embedBlock("https://embed.figma.com/board/nj3rvRhnhGHPoojzJFonxh/Cannon-Board?embed-host=share", "Open Cannon Board in Figma"),
      "Unit1-form-here": embedBlock("https://forms.cloud.microsoft.com/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUOFRVVUhTMUswUzBEWTBVTjQzQzY5NVJWWS4u&embed=true", "Open Form"),
      "Unit1-formANS-here": embedBlock("https://forms.cloud.microsoft.com/Pages/AnalysisPage.aspx?AnalyzerToken=GWhIwVOBfSGiYbBrbwU8McqYnS87Sl6e&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUOFRVVUhTMUswUzBEWTBVTjQzQzY5NVJWWS4u", "Open Form Analysis"),
      "Unit2-form-here": embedBlock("https://forms.cloud.microsoft.com/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUNFVHSVU4VzRCMlVNTTExOUFONTNYRjBJMC4u&embed=true", "Open Form"),
      "Unit2-formANS-here": embedBlock("https://forms.cloud.microsoft.com/Pages/AnalysisPage.aspx?AnalyzerToken=NbUyeN4dPXxMzyc26vZW5IeiKhlXnoAO&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUNFVHSVU4VzRCMlVNTTExOUFONTNYRjBJMC4u", "Open Form Analysis"),
      "Unit4-moodboard-here": embedBlock("https://embed.figma.com/board/vC87CfHAXm2Hl2MSUYLsQa/Twine-Mood-board?node-id=0-1&embed-host=share", "Open Twine Mood Board in Figma"),
      "Unit4-form-here": embedBlock("https://forms.cloud.microsoft.com/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUN09ZNUZRVTNZODZJSlJBTDA0QThDREtIRS4u&embed=true", "Open Form"),
      "Unit4-formANS-here": embedBlock("https://forms.cloud.microsoft.com/Pages/AnalysisPage.aspx?AnalyzerToken=IqfQOSxrfkVAFynsgvV5N4Dns5EQYF1f&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUN09ZNUZRVTNZODZJSlJBTDA0QThDREtIRS4u", "Open Form Analysis")
    };
    for (const key in replacements) {
      content = content.replaceAll(key, replacements[key]);
    }
    return content;
  }

  function getWordCount(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    temp.querySelectorAll("iframe, img, video, audio, figure, script, style").forEach((el) => el.remove());
    const refs = [...temp.querySelectorAll("h1, h2, h3")].find((h) => h.textContent.trim().toLowerCase() === "references");
    if (refs) {
      let node = refs;
      while (node) {
        const next = node.nextSibling;
        node.remove();
        node = next;
      }
    }
    return (temp.textContent || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function rehydrateFigma() {
    document.querySelectorAll("iframe[src*='figma.com']").forEach((old) => {
      old.replaceWith(old.cloneNode(true));
    });
  }

  function enhanceImageCompare(scope) {
    scope = scope || document;
    scope.querySelectorAll("figure.wp-block-jetpack-image-compare").forEach((figure, index) => {
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

      const sync = (value) => {
        wrapper.style.setProperty("--pos", `${Math.max(0, Math.min(100, Number(value)))}%`);
      };
      const updateFromPointer = (clientX) => {
        const rect = viewport.getBoundingClientRect();
        sync(((clientX - rect.left) / rect.width) * 100);
      };
      viewport.addEventListener("pointerdown", (e) => {
        if (e.target?.closest?.("a")) return;
        updateFromPointer(e.clientX);
        const onMove = (ev) => updateFromPointer(ev.clientX);
        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
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

  function renderPost(p) {
    const processedContent = replaceEmbeds(p.content?.rendered || p.content || "");
    const wordCount = getWordCount(processedContent);
    postContainer.innerHTML = `
      <h1>${p.title?.rendered || p.title || "Untitled"}</h1>
      <p class="word-count">Word count: ${wordCount}</p>
      <div class="post-content">${processedContent}</div>
    `;
    enhanceImageCompare(postContainer);
    rehydrateFigma();
    if (window.koLightbox) window.koLightbox.wrapEmbeds(postContainer);
    if (window.initGlbViewers) window.initGlbViewers(postContainer);
  }

  function showError(container, message, hint) {
    if (!container) return;
    container.innerHTML = `
      <div class="ko-wp-error" style="text-align:center;padding:3rem 2rem;color:var(--text-muted);">
        <p style="margin-bottom:0.5rem;">${message}</p>
        ${hint ? `<p style="font-size:0.85rem;opacity:0.8;">${hint}</p>` : ""}
      </div>
    `;
  }

  const isFileProtocol = window.location.protocol === "file:";
  const offlineHint = isFileProtocol
    ? "Open via a local server (e.g. <code>npx serve</code> or <code>python -m http.server 8000</code>) to load posts."
    : "Check your connection or add posts to <code>data/edu-posts.json</code> and <code>data/projects-posts.json</code> for offline use.";

  function loadPostBySlug(slug) {
    showWpLoaderIn(postContainer, "Loading…");
    fetchPostBySlugWithFallback(API_BASE, LOCAL_PATH, slug)
      .then(renderPost)
      .catch(() => showError(postContainer, "Failed to load post.", offlineHint))
      .finally(() => hideWpLoaderIn(postContainer));
  }

  function loadPostById(id) {
    showWpLoaderIn(postContainer, "Loading…");
    fetchPostByIdWithFallback(API_BASE, LOCAL_PATH, id)
      .then(renderPost)
      .catch(() => showError(postContainer, "Failed to load post.", offlineHint))
      .finally(() => hideWpLoaderIn(postContainer));
  }

  function loadPostList() {
    showWpLoaderIn(postsContainer, "Loading…");
    fetchPostsWithFallback(API_BASE, LOCAL_PATH)
      .then((posts) => {
        if (!Array.isArray(posts)) throw new Error("Invalid data");
        posts.sort((a, b) =>
          (a.title?.rendered || a.title || "").localeCompare(b.title?.rendered || b.title || "", undefined, { numeric: true, sensitivity: "base" })
        );
        postsContainer.innerHTML = posts.map((p) => {
          const img = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || p.featured_media_url;
          const href = `${config.link}.html?slug=${p.slug}`;
          return `
            <a href="${href}" class="post-card">
              ${img ? `<img src="${img}" alt="${p.title?.rendered || p.title || ""}">` : ""}
              <h3>${p.title?.rendered || p.title || "Untitled"}</h3>
              <p>${(p.excerpt?.rendered || p.excerpt || "").replace(/<[^>]+>/g, "")}</p>
              <span>Read more →</span>
            </a>
          `;
        }).join("");
      })
      .catch(() => showError(postsContainer, "Failed to load posts.", offlineHint))
      .finally(() => hideWpLoaderIn(postsContainer));
  }

  function loadRoadPostsInto(container, apiBase, localPath, linkPage) {
    if (!container) return;

    fetchPostsWithFallback(apiBase, localPath)
      .then((posts) => {
        if (!Array.isArray(posts)) throw new Error("Invalid data");
        posts.sort((a, b) =>
          (a.title?.rendered || a.title || "").localeCompare(b.title?.rendered || b.title || "", undefined, { numeric: true, sensitivity: "base" })
        );

        container.innerHTML = posts.map((p) => {
          const img = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || p.featured_media_url;
          const href = `${linkPage}.html?slug=${p.slug}`;
          const excerpt = (p.excerpt?.rendered || p.excerpt || "").replace(/<[^>]+>/g, "").trim();
          const tags = (p._embedded?.["wp:term"]?.[1] || []).map((t) => t.name);
          const cats = (p._embedded?.["wp:term"]?.[0] || []).map((c) => c.name);
          const allTags = [...cats, ...tags];

          return `
            <div class="road-post">
              <a href="${href}" class="road-card">
                ${img ? `<img class="road-card__img" src="${img}" alt="${p.title?.rendered || p.title || ""}" loading="lazy" draggable="false">` : ""}
                <div class="road-card__body">
                  ${allTags.length ? `<div class="road-card__tags">${allTags.map((t) => `<span class="road-card__tag">${t}</span>`).join("")}</div>` : ""}
                  <div class="road-card__title">${p.title?.rendered || p.title || "Untitled"}</div>
                  <div class="road-card__excerpt">${excerpt}</div>
                  <span class="road-card__more">Read more →</span>
                </div>
              </a>
            </div>
          `;
        }).join("");

        container.querySelectorAll(".road-post").forEach((el) => {
          if (typeof IntersectionObserver !== "undefined" && window._roadObserver) {
            window._roadObserver.observe(el);
          } else {
            el.classList.add("visible");
          }
        });
      })
      .catch(() => showError(container, "Failed to load posts.", offlineHint));
  }

  /* ======================
     ROUTING
  ====================== */
  if (config.mode === "single" && postContainer) {
    if (postSlug) loadPostBySlug(postSlug);
    else if (postId) loadPostById(postId);
  }

  if (config.mode === "list" && postsContainer) {
    loadPostList();
  }

  if (config.mode === "road" && postsContainer) {
    window._roadObserver =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) e.target.classList.add("visible");
            });
          }, { threshold: 0.15 })
        : null;

    loadRoadPostsInto(postsContainer, API_BASE, LOCAL_PATH, config.link);

    if (projectsPostsContainer) {
      loadRoadPostsInto(projectsPostsContainer, PROJECTS_API, PROJECTS_LOCAL, "blog");
    }
  }
})();
