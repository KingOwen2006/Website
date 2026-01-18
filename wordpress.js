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
    }
  };

  /* ======================
     PAGE DETECTION
     (LOCAL + ONLINE)
  ====================== */
  function getPageKey() {
    let path = window.location.pathname;

    if (window.location.protocol === "file:") {
      return path.split("/").pop() || "index.html";
    }

    if (path.endsWith("/")) path = path.slice(0, -1);
    const segments = path.split("/").filter(Boolean);

    if (!segments.length) return "index.html";

    // Handle clean URLs: /blog/slug → blog.html, /post/slug → post.html
    const firstSegment = segments[0];
    if ((firstSegment === "blog" || firstSegment === "post") && segments.length >= 1) {
      return firstSegment + ".html";
    }

    // Regular pages: /projects → projects.html
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

  /* ======================
     DOM
  ====================== */
  const postContainer = document.getElementById("post");
  const postsContainer = document.getElementById("posts");

  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id"); // fallback for old links

  // Extract slug from clean URL path (e.g., /blog/my-post → my-post)
  function getSlugFromPath() {
    const path = window.location.pathname;
    const segments = path.split("/").filter(Boolean);
    console.log("URL path:", path, "Segments:", segments);
    
    // If path is like /blog/slug or /post/slug, return the slug
    if (segments.length >= 2) {
      const base = segments[0];
      if ((base === "blog" || base === "post") && segments[1]) {
        // Join remaining segments in case slug has slashes
        const slug = segments.slice(1).join("/");
        console.log("Extracted slug:", slug);
        return slug;
      }
    }
    return null;
  }

  const postSlug = getSlugFromPath() || params.get("slug");
  console.log("Final postSlug:", postSlug, "postId:", postId);

  /* ======================
     EMBED REPLACEMENTS
  ====================== */
  function replaceEmbeds(content) {
    const replacements = {
      "Unit1-moodboard1-here": `
        <div class="figma-wrapper">
          <iframe src="https://embed.figma.com/board/F0BfcSQpK4EtYVEtlb9lwV/Mood-Board?node-id=0-1&embed-host=share"></iframe>
        </div>
      `,
    
      "Unit1-moodboard2-here": `
        <div class="figma-wrapper">
          <iframe src="https://embed.figma.com/board/nj3rvRhnhGHPoojzJFonxh/Cannon-Board?embed-host=share"></iframe>
        </div>
      `,
    
      "Unit1-form-here": `
        <div class="figma-wrapper">
          <iframe src="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUOFRVVUhTMUswUzBEWTBVTjQzQzY5NVJWWS4u&embed=true"></iframe>
        </div>
      `,
    
      "Unit1-formANS-here": `
        <div class="figma-wrapper">
          <iframe src="https://forms.cloud.microsoft/Pages/AnalysisPage.aspx?AnalyzerToken=GWhIwVOBfSGiYbBrbwU8McqYnS87Sl6e&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUOFRVVUhTMUswUzBEWTBVTjQzQzY5NVJWWS4u"></iframe>
        </div>
      `,
    
      "Unit2-form-here": `
        <div class="figma-wrapper">
          <iframe src="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUNFVHSVU4VzRCMlVNTTExOUFONTNYRjBJMC4u&embed=true"></iframe>
        </div>
      `,
    
      "Unit2-formANS-here": `
        <div class="figma-wrapper">
          <iframe src="https://forms.cloud.microsoft/Pages/AnalysisPage.aspx?AnalyzerToken=NbUyeN4dPXxMzyc26vZW5IeiKhlXnoAO&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUNFVHSVU4VzRCMlVNTTExOUFONTNYRjBJMC4u"></iframe>
        </div>
      `,
    
      "Unit4-moodboard-here": `
        <div class="figma-wrapper">
          <iframe src="https://embed.figma.com/board/vC87CfHAXm2Hl2MSUYLsQa/Twine-Mood-board?node-id=0-1&embed-host=share"></iframe>
        </div>
      `,
    
      "Unit4-form-here": `
        <div class="figma-wrapper">
          <iframe src="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUN09ZNUZRVTNZODZJSlJBTDA0QThDREtIRS4u&embed=true"></iframe>
        </div>
      `,
    
      "Unit4-formANS-here": `
        <div class="figma-wrapper">
          <iframe src="https://forms.cloud.microsoft/Pages/AnalysisPage.aspx?AnalyzerToken=IqfQOSxrfkVAFynsgvV5N4Dns5EQYF1f&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUN09ZNUZRVTNZODZJSlJBTDA0QThDREtIRS4u"></iframe>
        </div>
      `
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
  
    // Remove embeds
    temp.querySelectorAll(
      "iframe, img, video, audio, figure, script, style"
    ).forEach(el => el.remove());
  
    // Remove References section
    const refs = [...temp.querySelectorAll("h1, h2, h3")]
      .find(h => h.textContent.trim().toLowerCase() === "references");
  
    if (refs) {
      let node = refs;
      while (node) {
        const next = node.nextSibling;
        node.remove();
        node = next;
      }
    }
  
    return (temp.textContent || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
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
     (Before/After slider)
  ====================== */
  function enhanceImageCompare(scope = document) {
    const figures = scope.querySelectorAll("figure.wp-block-jetpack-image-compare");
    figures.forEach((figure, index) => {
      const juxtapose = figure.querySelector(".juxtapose");
      const imgs = (juxtapose || figure).querySelectorAll("img");
      if (imgs.length < 2) return;

      const before = imgs[0];
      const after = imgs[1];

      const beforeClone = before.cloneNode(true);
      const afterClone = after.cloneNode(true);

      // Avoid duplicate IDs after cloning
      beforeClone.removeAttribute("id");
      afterClone.removeAttribute("id");

      // Use a11y-friendly alts if missing
      if (!beforeClone.getAttribute("alt")) beforeClone.setAttribute("alt", "Before image");
      if (!afterClone.getAttribute("alt")) afterClone.setAttribute("alt", "After image");

      // Preserve caption if present
      const caption = figure.querySelector("figcaption");

      const wrapper = document.createElement("figure");
      wrapper.className = "ko-compare";
      wrapper.style.setProperty("--pos", "50%");
      wrapper.dataset.compareIndex = String(index);

      const viewport = document.createElement("div");
      viewport.className = "ko-compare__viewport";

      beforeClone.classList.add("ko-compare__img", "ko-compare__img--before");

      afterClone.classList.add("ko-compare__img", "ko-compare__img--after");

      const handle = document.createElement("div");
      handle.className = "ko-compare__handle";
      handle.setAttribute("aria-hidden", "true");

      const range = document.createElement("input");
      range.className = "ko-compare__range";
      range.type = "range";
      range.min = "0";
      range.max = "100";
      range.value = "50";
      range.setAttribute("aria-label", "Image comparison slider");

      const sync = (value) => {
        const v = Math.max(0, Math.min(100, Number(value)));
        wrapper.style.setProperty("--pos", `${v}%`);
        range.value = String(v);
      };

      range.addEventListener("input", (e) => sync(e.target.value));

      // Pointer interaction anywhere on the image area
      const updateFromPointer = (clientX) => {
        const rect = viewport.getBoundingClientRect();
        const ratio = (clientX - rect.left) / rect.width;
        sync(Math.round(ratio * 100));
      };

      const onPointerMove = (e) => updateFromPointer(e.clientX);
      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      viewport.addEventListener("pointerdown", (e) => {
        // Don't block link clicks inside content (rare, but safe)
        if (e.target && e.target.closest && e.target.closest("a")) return;
        updateFromPointer(e.clientX);
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
      });

      viewport.appendChild(beforeClone);
      viewport.appendChild(afterClone);
      viewport.appendChild(handle);

      wrapper.appendChild(viewport);
      wrapper.appendChild(range);

      // Re-attach the caption after the slider so existing caption styles still apply
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
      <div class="post-content">
        ${processedContent}
      </div>
    `;

    enhanceImageCompare(postContainer);
    rehydrateFigma();
  }

  function loadPostBySlug(slug) {
    const url = `${API_BASE}/posts?slug=${encodeURIComponent(slug)}&_embed`;
    console.log("Fetching post by slug:", slug, "URL:", url);
    
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Post not found");
        return res.json();
      })
      .then(posts => {
        console.log("Posts returned:", posts.length, posts);
        if (!posts.length) throw new Error("Post not found");
        renderPost(posts[0]);
      })
      .catch(err => {
        console.error("Load error:", err);
        postContainer.innerHTML = `<p>Failed to load post. Slug: "${slug}"</p>`;
      });
  }

  function loadPostById(id) {
    fetch(`${API_BASE}/posts/${id}?_embed`)
      .then(res => {
        if (!res.ok) throw new Error("Post not found");
        return res.json();
      })
      .then(renderPost)
      .catch(err => {
        console.error(err);
        postContainer.innerHTML = `<p>Failed to load post.</p>`;
      });
  }

  /* ======================
     POST LIST
  ====================== */
  function loadPostList() {
    fetch(`${API_BASE}/posts?_embed&per_page=100`)
      .then(res => {
        if (!res.ok) throw new Error("Posts not found");
        return res.json();
      })
      .then(posts => {
        posts.sort((a, b) =>
          a.title.rendered.localeCompare(b.title.rendered, undefined, {
            numeric: true,
            sensitivity: "base"
          })
        );

        postsContainer.innerHTML = posts.map(p => {
          const img =
            p._embedded?.["wp:featuredmedia"]?.[0]?.source_url;

          // Local file: use query string; Online: use clean path
          const href =
            window.location.protocol === "file:"
              ? `${config.link}.html?slug=${p.slug}`
              : `/${config.link}/${p.slug}`;

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
      .catch(err => {
        console.error(err);
        postsContainer.innerHTML = `<p>Failed to load posts.</p>`;
      });
  }

  /* ======================
     ROUTING
  ====================== */
  console.log("Routing - mode:", config.mode, "postContainer:", !!postContainer, "postSlug:", postSlug, "postId:", postId);
  
  if (config.mode === "single" && postContainer) {
    if (postSlug) {
      loadPostBySlug(postSlug);
    } else if (postId) {
      loadPostById(postId);
    } else {
      console.warn("No slug or id found for single post page");
    }
  }

  if (config.mode === "list" && postsContainer) {
    loadPostList();
  }
})();
