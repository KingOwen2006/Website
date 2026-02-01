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

  /* ======================
     IMAGE DRAG (UX)
     Stop "ghost dragging" images
  ====================== */
  onReady(() => {
    // 1) Block dragging globally (covers dynamically-inserted images too)
    document.addEventListener(
      "dragstart",
      (e) => {
        const t = e.target;
        if (t && t.tagName === "IMG") e.preventDefault();
      },
      { capture: true }
    );

    // 2) Mark current + future <img> as draggable=false (nice to have)
    const setDraggableFalse = (scope) => {
      scope.querySelectorAll?.("img").forEach((img) => {
        img.setAttribute("draggable", "false");
      });
    };

    setDraggableFalse(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.tagName === "IMG") node.setAttribute("draggable", "false");
          setDraggableFalse(node);
        }
      }
    });

    mo.observe(document.documentElement, { childList: true, subtree: true });
  });

  window.toggleTheme = function () {
    const isDark = root.getAttribute("data-theme") === "dark";
    const newTheme = isDark ? "light" : "dark";
    root.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeToggleIcons(newTheme);
  };

  /* ======================
     LIGHTBOX GALLERY
  ====================== */
  onReady(() => {
    // Selectors for images that should NOT open in lightbox
    const EXCLUDE_SELECTORS = [
      ".nav-icon",
      ".theme-toggle__icon",
      ".ko-home__pfp img",
      ".post-card img",
      ".ko-compare__img"
    ].join(", ");

    let lightbox = null;
    let lightboxImg = null;
    let lightboxContent = null;
    let lightboxCounter = null;
    let prevBtn = null;
    let nextBtn = null;
    let galleryItems = []; // Can be images or .ko-compare elements
    let currentIndex = 0;

    function createLightbox() {
      if (lightbox) return;

      lightbox = document.createElement("div");
      lightbox.className = "lightbox";
      lightbox.innerHTML = `
        <button class="lightbox__close" aria-label="Close">&times;</button>
        <button class="lightbox__nav lightbox__nav--prev" aria-label="Previous">&#8249;</button>
        <img class="lightbox__img" src="" alt="">
        <div class="lightbox__content"></div>
        <button class="lightbox__nav lightbox__nav--next" aria-label="Next">&#8250;</button>
        <div class="lightbox__counter"></div>
      `;
      document.body.appendChild(lightbox);

      lightboxImg = lightbox.querySelector(".lightbox__img");
      lightboxContent = lightbox.querySelector(".lightbox__content");
      lightboxCounter = lightbox.querySelector(".lightbox__counter");
      prevBtn = lightbox.querySelector(".lightbox__nav--prev");
      nextBtn = lightbox.querySelector(".lightbox__nav--next");

      // Close handlers
      lightbox.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
      lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) closeLightbox();
      });

      // Navigation
      prevBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigate(-1);
      });
      nextBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigate(1);
      });

      // Keyboard
      document.addEventListener("keydown", (e) => {
        if (!lightbox.classList.contains("is-open")) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") navigate(-1);
        if (e.key === "ArrowRight") navigate(1);
      });
    }

    function collectGalleryItems() {
      galleryItems = [];

      // Collect regular images (excluding UI images and images inside ko-compare)
      const allImages = document.querySelectorAll("img");
      allImages.forEach(img => {
        if (img.matches(EXCLUDE_SELECTORS)) return;
        if (img.closest(".ko-compare")) return; // Skip images inside comparison sliders
        if (!img.src || img.src.includes("data:")) return;
        if (img.naturalWidth && img.naturalWidth < 50) return;
        galleryItems.push({ type: "image", element: img });
        img.classList.add("gallery-item");
      });

      // Collect comparison sliders
      const compares = document.querySelectorAll(".ko-compare");
      compares.forEach(compare => {
        galleryItems.push({ type: "compare", element: compare });
        compare.classList.add("gallery-item");
      });

      // Sort by document order
      galleryItems.sort((a, b) => {
        const pos = a.element.compareDocumentPosition(b.element);
        return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
    }

    function openLightbox(item) {
      createLightbox();
      collectGalleryItems();

      currentIndex = galleryItems.findIndex(gi => gi.element === item.element);
      if (currentIndex === -1) currentIndex = 0;

      updateLightbox();
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.remove("is-open", "is-compare");
      lightboxContent.innerHTML = "";
      document.body.style.overflow = "";
    }

    function navigate(dir) {
      currentIndex += dir;
      if (currentIndex < 0) currentIndex = galleryItems.length - 1;
      if (currentIndex >= galleryItems.length) currentIndex = 0;
      updateLightbox();
    }

    function setupCompareSlider(wrapper) {
      const viewport = wrapper.querySelector(".ko-compare__viewport");
      const range = wrapper.querySelector(".ko-compare__range");
      if (!viewport || !range) return;

      const sync = (value) => {
        const v = Math.max(0, Math.min(100, Number(value)));
        wrapper.style.setProperty("--pos", `${v}%`);
        range.value = String(v);
      };

      range.addEventListener("input", (e) => sync(e.target.value));

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
        e.stopPropagation();
        updateFromPointer(e.clientX);
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
      });
    }

    function updateLightbox() {
      if (!galleryItems.length) return;

      const item = galleryItems[currentIndex];
      lightboxContent.innerHTML = "";

      if (item.type === "compare") {
        // Clone the comparison slider
        const clone = item.element.cloneNode(true);
        clone.classList.remove("gallery-item");
        clone.style.setProperty("--pos", item.element.style.getPropertyValue("--pos") || "50%");
        lightboxContent.appendChild(clone);
        setupCompareSlider(clone);
        lightbox.classList.add("is-compare");
      } else {
        // Regular image
        lightboxImg.src = item.element.src;
        lightboxImg.alt = item.element.alt || "";
        lightbox.classList.remove("is-compare");
      }

      lightboxCounter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;

      // Show/hide nav if only one item
      const showNav = galleryItems.length > 1;
      prevBtn.style.display = showNav ? "" : "none";
      nextBtn.style.display = showNav ? "" : "none";
      lightboxCounter.style.display = showNav ? "" : "none";
    }

    // Delegate click handler for images and comparison sliders
    document.addEventListener("click", (e) => {
      // Check for comparison slider click (on the viewport)
      const compare = e.target.closest(".ko-compare");
      if (compare && compare.classList.contains("gallery-item")) {
        // Only open if clicking the viewport area, not the range slider
        if (e.target.closest(".ko-compare__range")) return;
        e.preventDefault();
        openLightbox({ type: "compare", element: compare });
        return;
      }

      // Check for regular image click
      const img = e.target.closest("img");
      if (!img) return;
      if (img.matches(EXCLUDE_SELECTORS)) return;
      if (img.closest(".ko-compare")) return;
      if (!img.src || img.src.includes("data:")) return;
      if (img.closest("a")) return;

      e.preventDefault();
      openLightbox({ type: "image", element: img });
    });
  });

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
     LOADING ANIMATION
  ====================== */
  let loaderIdCounter = 0;

  function getLoaderHTML(id) {
    return `
      <div class="ko-loader-wrapper">
        <div class="ko-loader" data-loader-id="${id}">
          <div class="ko-loader__text">
            Loading<span class="ko-loader__dots"><span class="ko-loader__dot">.</span><span class="ko-loader__dot">.</span><span class="ko-loader__dot">.</span></span>
          </div>
          <div class="ko-loader__bar-wrap">
            <div class="ko-loader__bar-container">
              <div class="ko-loader__bar"></div>
              <div class="ko-loader__percent">0%</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function simulateProgress(loaderId) {
    const loader = document.querySelector(`[data-loader-id="${loaderId}"]`);
    if (!loader) return { stop: () => {}, complete: (cb) => cb && cb() };

    const bar = loader.querySelector('.ko-loader__bar');
    const percent = loader.querySelector('.ko-loader__percent');
    let progress = 0;
    let speed = 2;
    let completed = false;

    const interval = setInterval(() => {
      if (completed) return;
      
      // Slow down as we approach 90%
      if (progress < 30) speed = 3;
      else if (progress < 60) speed = 2;
      else if (progress < 85) speed = 1;
      else speed = 0.3;

      progress = Math.min(progress + speed + Math.random() * speed, 90);
      bar.style.width = Math.round(progress) + '%';
      percent.textContent = Math.round(progress) + '%';
    }, 80);

    return {
      stop: () => {
        completed = true;
        clearInterval(interval);
      },
      complete: (onComplete) => {
        completed = true;
        clearInterval(interval);
        // Animate to 100%
        let current = progress;
        const finishInterval = setInterval(() => {
          current = Math.min(current + 5, 100);
          bar.style.width = Math.round(current) + '%';
          percent.textContent = Math.round(current) + '%';
          if (current >= 100) {
            clearInterval(finishInterval);
            if (onComplete) setTimeout(onComplete, 150);
          }
        }, 30);
      }
    };
  }

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
    
    // Show loader
    const loaderId = 'post-' + (++loaderIdCounter);
    postContainer.innerHTML = getLoaderHTML(loaderId);
    const progress = simulateProgress(loaderId);
    
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Post not found");
        return res.json();
      })
      .then(posts => {
        console.log("Posts returned:", posts.length, posts);
        if (!posts.length) throw new Error("Post not found");
        progress.complete(() => renderPost(posts[0]));
      })
      .catch(err => {
        console.error("Load error:", err);
        progress.stop();
        postContainer.innerHTML = `<p>Failed to load post. Slug: "${slug}"</p>`;
      });
  }

  function loadPostById(id) {
    // Show loader
    const loaderId = 'post-' + (++loaderIdCounter);
    postContainer.innerHTML = getLoaderHTML(loaderId);
    const progress = simulateProgress(loaderId);
    
    fetch(`${API_BASE}/posts/${id}?_embed`)
      .then(res => {
        if (!res.ok) throw new Error("Post not found");
        return res.json();
      })
      .then(post => {
        progress.complete(() => renderPost(post));
      })
      .catch(err => {
        console.error(err);
        progress.stop();
        postContainer.innerHTML = `<p>Failed to load post.</p>`;
      });
  }

  /* ======================
     POST LIST
  ====================== */
  function loadPostList() {
    // Show loader
    const loaderId = 'posts-' + (++loaderIdCounter);
    postsContainer.innerHTML = getLoaderHTML(loaderId);
    const progress = simulateProgress(loaderId);
    
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

        progress.complete(() => {
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
                ${img ? `<img src="${img}" alt="${p.title.rendered}" draggable="false">` : ""}
                <h3>${p.title.rendered}</h3>
                <p>${p.excerpt.rendered.replace(/<[^>]+>/g, "")}</p>
                <span>Read more →</span>
              </a>
            `;
          }).join("");
        });
      })
      .catch(err => {
        console.error(err);
        progress.stop();
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
