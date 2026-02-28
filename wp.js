(function () {
  /* ======================
     THEME (ALWAYS LOADS)
  ====================== */
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme) {
    root.setAttribute("data-theme", savedTheme);
  }

  function getEffectiveTheme() {
    const explicit = root.getAttribute("data-theme");
    if (explicit === "dark" || explicit === "light") return explicit;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function updateThemeToggleIcons(theme = getEffectiveTheme()) {
    document.querySelectorAll(".theme-toggle__icon").forEach(img => {
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
     WORDPRESS LOADER (INLINE, REUSABLE)
  ====================== */
  const KO_WP_LOADER_ID = "ko-wp-inline-loader";

  function getInlineLoaderHtml(text = "Loading…") {
    return `
      <div class="ko-wp-inline-loader" id="${KO_WP_LOADER_ID}" role="status" aria-live="polite">
        <div class="ko-wp-inline-loader__card">
          <div class="ko-wp-inline-loader__row">
            <div>
              <div class="ko-wp-inline-loader__text">${String(text)}</div>
            </div>
          </div>
          <div class="ko-wp-inline-loader__bar" aria-hidden="true"></div>
        </div>
      </div>
    `;
  }

  function showWpLoaderIn(container, text) {
    if (!container) return;
    container.innerHTML = getInlineLoaderHtml(text);
  }

  function hideWpLoaderIn(container) {
    if (!container) return;
    const el = container.querySelector(`#${KO_WP_LOADER_ID}`);
    if (el) el.remove();
  }

  window.koWpLoader = {
    showIn: showWpLoaderIn,
    hideIn: hideWpLoaderIn
  };

  /* ======================
     PAGE → WORDPRESS MAP
  ====================== */
  const PAGE_CONFIG = {
    "projects.html": {
      api: "https://public-api.wordpress.com/wp/v2/sites/kingowenblog.wordpress.com",
      mode: "list",
      link: "blog"
    },
    "blog.html": {
      api: "https://public-api.wordpress.com/wp/v2/sites/kingowenblog.wordpress.com",
      mode: "single"
    },
    "edu.html": {
      api: "https://public-api.wordpress.com/wp/v2/sites/kingowenfyi.wordpress.com",
      mode: "list",
      link: "post"
    },
    "post.html": {
      api: "https://public-api.wordpress.com/wp/v2/sites/kingowenfyi.wordpress.com",
      mode: "single"
    },
    "index.html": {
      api: "https://public-api.wordpress.com/wp/v2/sites/kingowenfyi.wordpress.com",
      mode: "road",
      link: "post"
    }
  };

  /* ======================
     PAGE DETECTION
  ====================== */
  function getPageKey() {
    let path = window.location.pathname;
    if (window.location.protocol === "file:") {
      return path.split("/").pop() || "index.html";
    }
    if (path.endsWith("/")) path = path.slice(0, -1);
    const segments = path.split("/").filter(Boolean);
    if (!segments.length) return "index.html";
    const firstSegment = segments[0];
    if ((firstSegment === "blog" || firstSegment === "post") && segments.length >= 1) {
      return firstSegment + ".html";
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

  const API_BASE = config.api;
  const INDEX_PROJECTS_API = "https://public-api.wordpress.com/wp/v2/sites/kingowenblog.wordpress.com";

  /* ======================
     DOM
  ====================== */
  const postContainer = document.getElementById("post");
  const postsContainer = document.getElementById("posts");
  const projectsPostsContainer = document.getElementById("projects-posts");

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  function getSlugFromPath() {
    const path = window.location.pathname;
    const segments = path.split("/").filter(Boolean);
    if (segments.length >= 2) {
      const base = segments[0];
      if ((base === "blog" || base === "post") && segments[1]) {
        return segments.slice(1).join("/");
      }
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
      <model-viewer src="${modelSrc}" alt="${altText}" auto-rotate camera-controls shadow-intensity="1" style="width:100%;min-height:500px;background:var(--panel);"></model-viewer>
      <a href="${modelSrc}" target="_blank" rel="noopener" download class="embed-mobile-link">${linkText}</a>
    </div>`;
  }
  function replaceEmbeds(content) {
    const replacements = {
      "Interactive-Ship-Here": modelEmbedBlock("Models/Unit3ShipDone.glb", "Unit 3 Ship Model", "View / Download Ship Model"),
      "Unit1-moodboard1-here": embedBlock("https://embed.figma.com/board/F0BfcSQpK4EtYVEtlb9lwV/Mood-Board?node-id=0-1&embed-host=share", "Open Mood Board in Figma"),
      "Unit1-moodboard2-here": embedBlock("https://embed.figma.com/board/nj3rvRhnhGHPoojzJFonxh/Cannon-Board?embed-host=share", "Open Cannon Board in Figma"),
      "Unit1-form-here": embedBlock("https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUOFRVVUhTMUswUzBEWTBVTjQzQzY5NVJWWS4u&embed=true", "Open Form"),
      "Unit1-formANS-here": embedBlock("https://forms.cloud.microsoft/Pages/AnalysisPage.aspx?AnalyzerToken=GWhIwVOBfSGiYbBrbwU8McqYnS87Sl6e&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUOFRVVUhTMUswUzBEWTBVTjQzQzY5NVJWWS4u", "Open Form Analysis"),
      "Unit2-form-here": embedBlock("https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUNFVHSVU4VzRCMlVNTTExOUFONTNYRjBJMC4u&embed=true", "Open Form"),
      "Unit2-formANS-here": embedBlock("https://forms.cloud.microsoft/Pages/AnalysisPage.aspx?AnalyzerToken=NbUyeN4dPXxMzyc26vZW5IeiKhlXnoAO&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUNFVHSVU4VzRCMlVNTTExOUFONTNYRjBJMC4u", "Open Form Analysis"),
      "Unit4-moodboard-here": embedBlock("https://embed.figma.com/board/vC87CfHAXm2Hl2MSUYLsQa/Twine-Mood-board?node-id=0-1&embed-host=share", "Open Twine Mood Board in Figma"),
      "Unit4-form-here": embedBlock("https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUN09ZNUZRVTNZODZJSlJBTDA0QThDREtIRS4u&embed=true", "Open Form"),
      "Unit4-formANS-here": embedBlock("https://forms.cloud.microsoft/Pages/AnalysisPage.aspx?AnalyzerToken=IqfQOSxrfkVAFynsgvV5N4Dns5EQYF1f&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUN09ZNUZRVTNZODZJSlJBTDA0QThDREtIRS4u", "Open Form Analysis")
    };
    for (const key in replacements) {
      content = content.replaceAll(key, replacements[key]);
    }
    return content;
  }

  /* ======================
     WORD COUNT
  ====================== */
  function getWordCount(html) {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    temp.querySelectorAll("iframe, img, video, audio, figure, script, style").forEach(el => el.remove());
    const refs = [...temp.querySelectorAll("h1, h2, h3")].find(h => h.textContent.trim().toLowerCase() === "references");
    if (refs) {
      let node = refs;
      while (node) { const next = node.nextSibling; node.remove(); node = next; }
    }
    return (temp.textContent || "").trim().split(/\s+/).filter(Boolean).length;
  }

  /* ======================
     FIGMA EMBED RELOAD
  ====================== */
  function rehydrateFigma() {
    document.querySelectorAll("iframe[src*='figma.com']").forEach(old => {
      const clone = old.cloneNode(true);
      old.replaceWith(clone);
    });
  }

  /* ======================
     JETPACK IMAGE COMPARE
  ====================== */
  function enhanceImageCompare(scope = document) {
    const figures = scope.querySelectorAll("figure.wp-block-jetpack-image-compare");
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

      const sync = (value) => {
        const v = Math.max(0, Math.min(100, Number(value)));
        wrapper.style.setProperty("--pos", `${v}%`);
      };
      const updateFromPointer = (clientX) => {
        const rect = viewport.getBoundingClientRect();
        sync(Math.round(((clientX - rect.left) / rect.width) * 100));
      };
      const onPointerMove = (e) => updateFromPointer(e.clientX);
      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };
      viewport.addEventListener("pointerdown", (e) => {
        if (e.target?.closest?.("a")) return;
        updateFromPointer(e.clientX);
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
      });

      viewport.appendChild(before);
      viewport.appendChild(after);
      viewport.appendChild(handle);
      wrapper.appendChild(viewport);
      if (caption) wrapper.appendChild(caption);
      figure.replaceWith(wrapper);
    });
  }

  /* ======================
     SINGLE POST
  ====================== */
  function renderPost(p) {
    const processedContent = replaceEmbeds(p.content.rendered);
    const wordCount = getWordCount(processedContent);
    postContainer.innerHTML = `
      <h1>${p.title.rendered}</h1>
      <p class="word-count">Word count: ${wordCount}</p>
      <div class="post-content">${processedContent}</div>
    `;
    enhanceImageCompare(postContainer);
    rehydrateFigma();
    if (window.koLightbox) window.koLightbox.wrapEmbeds(postContainer);
  }

  function loadPostBySlug(slug) {
    showWpLoaderIn(postContainer, "Loading…");
    fetch(`${API_BASE}/posts?slug=${encodeURIComponent(slug)}&_embed`)
      .then(res => { if (!res.ok) throw new Error("Post not found"); return res.json(); })
      .then(posts => { if (!posts.length) throw new Error("Post not found"); renderPost(posts[0]); })
      .catch(() => { postContainer.innerHTML = `<p>Failed to load post.</p>`; })
      .finally(() => hideWpLoaderIn(postContainer));
  }

  function loadPostById(id) {
    showWpLoaderIn(postContainer, "Loading…");
    fetch(`${API_BASE}/posts/${id}?_embed`)
      .then(res => { if (!res.ok) throw new Error("Post not found"); return res.json(); })
      .then(renderPost)
      .catch(() => { postContainer.innerHTML = `<p>Failed to load post.</p>`; })
      .finally(() => hideWpLoaderIn(postContainer));
  }

  /* ======================
     POST LIST (projects/edu pages)
  ====================== */
  function loadPostList() {
    showWpLoaderIn(postsContainer, "Loading…");
    fetch(`${API_BASE}/posts?_embed&per_page=100`)
      .then(res => { if (!res.ok) throw new Error("Posts not found"); return res.json(); })
      .then(posts => {
        posts.sort((a, b) =>
          a.title.rendered.localeCompare(b.title.rendered, undefined, { numeric: true, sensitivity: "base" })
        );
        postsContainer.innerHTML = posts.map(p => {
          const img = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
          const href = `${config.link}.html?slug=${p.slug}`;
          return `
            <a href="${href}" class="post-card">
              ${img ? `<img src="${img}" alt="${p.title.rendered}">` : ""}
              <h3>${p.title.rendered}</h3>
              <p>${p.excerpt.rendered.replace(/<[^>]+>/g, "")}</p>
              <span>Read more →</span>
            </a>
          `;
        }).join("");
      })
      .catch(() => { postsContainer.innerHTML = `<p>Failed to load posts.</p>`; })
      .finally(() => hideWpLoaderIn(postsContainer));
  }

  /* ======================
     ROAD LAYOUT (index page — alternating left/right)
  ====================== */
  function loadRoadPostsInto(container, apiBase, linkPage) {
    if (!container) return;

    fetch(`${apiBase}/posts?_embed&per_page=100`)
      .then(res => { if (!res.ok) throw new Error("Posts not found"); return res.json(); })
      .then(posts => {
        posts.sort((a, b) =>
          a.title.rendered.localeCompare(b.title.rendered, undefined, { numeric: true, sensitivity: "base" })
        );

        container.innerHTML = posts.map(p => {
          const img = p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
          const href = `${linkPage}.html?slug=${p.slug}`;

          const excerpt = p.excerpt.rendered.replace(/<[^>]+>/g, "").trim();
          const tags = (p._embedded?.["wp:term"]?.[1] || []).map(t => t.name);
          const cats = (p._embedded?.["wp:term"]?.[0] || []).map(c => c.name);
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
            </div>
          `;
        }).join("");

        container.querySelectorAll(".road-post").forEach(el => {
          if (typeof IntersectionObserver !== "undefined" && window._roadObserver) {
            window._roadObserver.observe(el);
          } else {
            el.classList.add("visible");
          }
        });
      })
      .catch(() => {
        container.innerHTML = `<p style="text-align:center;color:#8899aa;">Failed to load posts.</p>`;
      });
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
    window._roadObserver = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(entries => {
          entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
        }, { threshold: .15 })
      : null;
    // Education feed (kingowenfyi)
    loadRoadPostsInto(postsContainer, API_BASE, config.link);

    // Projects feed (kingowenblog) — homepage only
    if (projectsPostsContainer) {
      loadRoadPostsInto(projectsPostsContainer, INDEX_PROJECTS_API, "blog");
    }
  }
})();
