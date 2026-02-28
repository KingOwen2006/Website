/* ======================
   LIGHTBOX GALLERY
   ====================== */
(function () {
  const EXCLUDE_SELECTORS = [
    ".nav-icon",
    ".theme-toggle__icon",
    ".ko-home__pfp img",
    ".post-card img",
    ".road-card img",
    ".ko-compare__img"
  ].join(", ");

  let lightbox = null;
  let lightboxImg = null;
  let lightboxContent = null;
  let lightboxCounter = null;
  let prevBtn = null;
  let nextBtn = null;
  let galleryItems = [];
  let currentIndex = 0;

  function createLightbox() {
    if (lightbox) return;

    const style = document.createElement("style");
    style.textContent = `
      .lightbox{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:2rem;opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s}
      .lightbox.is-open{opacity:1;visibility:visible}
      .lightbox__backdrop{position:absolute;inset:0;background:rgba(0,0,0,.9);backdrop-filter:blur(8px);cursor:pointer;z-index:0}
      .lightbox__close{position:fixed;top:20px;right:20px;width:44px;height:44px;border:none;background:rgba(0,0,0,.6);color:#fff;border-radius:10px;cursor:pointer;font-size:1.5rem;display:flex;align-items:center;justify-content:center;z-index:10001;transition:background .2s}
      .lightbox__close:hover{background:rgba(255,255,255,.2)}
      .lightbox__nav{position:fixed;top:50%;transform:translateY(-50%);width:48px;height:48px;border:none;background:rgba(0,0,0,.6);color:#fff;border-radius:50%;cursor:pointer;font-size:1.5rem;display:flex;align-items:center;justify-content:center;z-index:10001;transition:background .2s}
      .lightbox__nav:hover{background:rgba(255,255,255,.2)}
      .lightbox__nav--prev{left:20px}
      .lightbox__nav--next{right:20px}
      .lightbox__img{max-width:95vw;max-height:90vh;width:auto;height:auto;object-fit:contain;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.5);position:relative;z-index:1}
      .lightbox__content{position:relative;z-index:1;max-width:95vw;max-height:90vh;display:flex;align-items:center;justify-content:center}
      .lightbox.is-compare .lightbox__content{width:88vw;height:80vh;min-width:280px;min-height:180px}
      .lightbox__content .ko-compare{max-width:95vw;max-height:90vh;width:100%;height:100%;margin:0;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:#0b0f1a}
      .lightbox.is-compare .lightbox__content .ko-compare{max-width:100%;max-height:100%;width:100%;height:100%}
      .lightbox__content .ko-compare__viewport{position:relative;width:100%;height:100%;max-height:85vh;aspect-ratio:16/9;overflow:hidden;user-select:none;touch-action:none;cursor:col-resize}
      .lightbox.is-compare .lightbox__content .ko-compare__viewport{aspect-ratio:auto;max-height:none;width:100%;height:100%}
      .lightbox__content .ko-compare__viewport::after{content:"";position:absolute;top:0;bottom:0;left:var(--pos,50%);transform:translateX(-1px);width:2px;background:rgba(255,255,255,.9);pointer-events:none;box-shadow:0 0 8px rgba(255,255,255,.3)}
      .lightbox__content .ko-compare__img--before{position:absolute;inset:0;clip-path:inset(0 calc(100% - var(--pos,50%)) 0 0)}
      .lightbox__content .ko-compare__img--after{position:absolute;inset:0;clip-path:inset(0 0 0 var(--pos,50%))}
      .lightbox__content .ko-compare img{width:100%!important;max-width:none!important;height:100%!important;margin:0!important;border-radius:0!important;object-fit:cover;display:block}
      .lightbox__content .ko-compare__handle{position:absolute;top:0;left:var(--pos,50%);transform:translateX(-50%);width:0;height:100%;pointer-events:none}
      .lightbox__content .ko-compare__handle::before{content:"";position:absolute;top:50%;left:0;transform:translate(-50%,-50%);width:48px;height:48px;border-radius:50%;border:2px solid rgba(255,255,255,.5);background:rgba(20,25,35,.95);box-shadow:0 4px 20px rgba(0,0,0,.5)}
      .lightbox__content .ko-compare__handle::after{content:"↔";position:absolute;top:50%;left:0;transform:translate(-50%,-50%);font-weight:800;font-size:1.1rem;color:#64ffda;line-height:1}
      .lightbox__content iframe{width:95vw;height:85vh;min-width:320px;min-height:400px;border:0;border-radius:14px;background:#0b0f1a}
      .lightbox__counter{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:8px 16px;background:rgba(0,0,0,.6);color:rgba(255,255,255,.9);border-radius:8px;font-size:.85rem;z-index:10001}
      .lightbox.is-compare .lightbox__img,.lightbox.is-embed .lightbox__img{display:none}
      .lightbox:not(.is-compare):not(.is-embed) .lightbox__content{display:none}
      @media(max-width:768px){.lightbox__nav{width:40px;height:40px;font-size:1.2rem}.lightbox__nav--prev{left:12px}.lightbox__nav--next{right:12px}}
    `;
    document.head.appendChild(style);

    lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.innerHTML = `
      <div class="lightbox__backdrop" aria-hidden="true"></div>
      <button class="lightbox__close" aria-label="Close">&times;</button>
      <button class="lightbox__nav lightbox__nav--prev" aria-label="Previous">&#8249;</button>
      <img class="lightbox__img" src="" alt="" style="display:none">
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

    lightbox.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox__backdrop").addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

    prevBtn.addEventListener("click", (e) => { e.stopPropagation(); navigate(-1); });
    nextBtn.addEventListener("click", (e) => { e.stopPropagation(); navigate(1); });

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    });
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open", "is-compare", "is-embed");
    lightboxContent.innerHTML = "";
    lightboxImg.style.display = "none";
    lightboxImg.removeAttribute("src");
    document.body.style.overflow = "";
  }

  function navigate(dir) {
    if (galleryItems.length <= 1) return;
    currentIndex += dir;
    if (currentIndex < 0) currentIndex = galleryItems.length - 1;
    if (currentIndex >= galleryItems.length) currentIndex = 0;
    updateLightbox();
  }

  function setupCompareSlider(wrapper) {
    const viewport = wrapper.querySelector(".ko-compare__viewport");
    if (!viewport) return;

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
  }

  function collectGalleryItems() {
    galleryItems = [];
    const scope = document.querySelector(".post-content");
    if (!scope) return;

    const allImages = scope.querySelectorAll("img");
    allImages.forEach((img) => {
      if (img.matches(EXCLUDE_SELECTORS)) return;
      if (img.closest(".ko-compare")) return;
      if (!img.src || img.src.includes("data:")) return;
      if (img.naturalWidth && img.naturalWidth < 50) return;
      galleryItems.push({ type: "image", element: img });
    });

    scope.querySelectorAll(".ko-compare").forEach((compare) => {
      galleryItems.push({ type: "compare", element: compare });
    });

    scope.querySelectorAll("iframe[src*='youtube'], iframe[src*='youtu.be']").forEach((iframe) => {
      const wrapper = iframe.closest(".figma-wrapper") || iframe.parentElement || iframe;
      galleryItems.push({ type: "youtube", element: wrapper, src: iframe.src });
    });

    scope.querySelectorAll("iframe[src*='figma.com']").forEach((iframe) => {
      if (window.innerWidth <= 1023) return;
      const wrapper = iframe.closest(".figma-wrapper") || iframe.parentElement || iframe;
      galleryItems.push({ type: "figma", element: wrapper, src: iframe.src });
    });

    scope.querySelectorAll("iframe[src*='google.com/maps'], iframe[src*='maps.google']").forEach((iframe) => {
      const wrapper = iframe.closest(".figma-wrapper") || iframe.parentElement || iframe;
      galleryItems.push({ type: "maps", element: wrapper, src: iframe.src });
    });

    scope.querySelectorAll(".model-viewer-wrapper .glb-viewer[data-src]").forEach((el) => {
      const wrapper = el.closest(".model-viewer-wrapper");
      if (wrapper && window.innerWidth > 1023) galleryItems.push({ type: "model", element: wrapper, src: el.dataset.src || "" });
    });

    galleryItems.sort((a, b) => {
      const elA = a.element;
      const elB = b.element;
      if (elA === elB) return 0;
      const pos = elA.compareDocumentPosition(elB);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }

  function updateLightbox() {
    if (!galleryItems.length) return;

    const item = galleryItems[currentIndex];
    lightboxContent.innerHTML = "";
    lightbox.classList.remove("is-compare", "is-embed");
    lightboxImg.style.display = "none";

    if (item.type === "compare") {
      const clone = item.element.cloneNode(true);
      clone.style.setProperty("--pos", item.element.style.getPropertyValue("--pos") || "50%");
      lightboxContent.appendChild(clone);
      setupCompareSlider(clone);
      lightbox.classList.add("is-compare");
    } else if (item.type === "youtube" || item.type === "figma" || item.type === "maps") {
      const iframe = document.createElement("iframe");
      iframe.src = item.src;
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allowfullscreen", "true");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
      lightboxContent.appendChild(iframe);
      lightbox.classList.add("is-embed");
    } else if (item.type === "model") {
      const wrap = document.createElement("div");
      wrap.className = "glb-viewer";
      wrap.dataset.glbViewer = "";
      wrap.dataset.src = item.src;
      wrap.style.cssText = "width:95vw;height:85vh;min-width:320px;min-height:400px;background:#0b0f1a;border-radius:14px";
      const canvas = document.createElement("canvas");
      canvas.className = "glb-viewer__canvas";
      wrap.appendChild(canvas);
      lightboxContent.appendChild(wrap);
      if (window.initGlbViewers) window.initGlbViewers(lightboxContent);
      lightbox.classList.add("is-embed");
    } else {
      lightboxImg.src = item.element.src;
      lightboxImg.alt = item.element.alt || "";
      lightboxImg.style.display = "block";
    }

    lightboxCounter.textContent = `${currentIndex + 1} / ${galleryItems.length}`;
    const showNav = galleryItems.length > 1;
    prevBtn.style.display = showNav ? "flex" : "none";
    nextBtn.style.display = showNav ? "flex" : "none";
    lightboxCounter.style.display = showNav ? "block" : "none";
  }

  function openLightbox(item) {
    createLightbox();
    collectGalleryItems();

    currentIndex = galleryItems.findIndex((gi) => gi.element === item.element || (gi.src && gi.src === item.src));
    if (currentIndex === -1) currentIndex = 0;

    updateLightbox();
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function initLightbox() {
    createLightbox();

    document.addEventListener("click", (e) => {
      const compare = e.target.closest(".ko-compare");
      if (compare && compare.closest(".post-content")) {
        e.preventDefault();
        e.stopPropagation();
        openLightbox({ type: "compare", element: compare });
        return;
      }

      const embedWrapper = e.target.closest(".figma-wrapper, .ko-lightbox-embed-wrap");
      if (embedWrapper && embedWrapper.closest(".post-content")) {
        if (e.target.closest(".embed-mobile-link")) return;
        const glbViewer = embedWrapper.querySelector(".glb-viewer[data-src]");
        if (glbViewer && window.innerWidth > 1023) {
          e.preventDefault();
          e.stopPropagation();
          openLightbox({ type: "model", element: embedWrapper, src: glbViewer.dataset.src || "" });
          return;
        }
        const iframe = embedWrapper.querySelector("iframe");
        if (iframe && window.innerWidth <= 1023) return;
        if (iframe && (iframe.src.includes("figma.com") || iframe.src.includes("youtube") || iframe.src.includes("youtu.be") || iframe.src.includes("google.com/maps"))) {
          const type = iframe.src.includes("figma.com") ? "figma" : iframe.src.includes("maps") ? "maps" : "youtube";
          e.preventDefault();
          e.stopPropagation();
          openLightbox({ type, element: embedWrapper, src: iframe.src });
          return;
        }
      }

      const img = e.target.closest("img");
      if (!img) return;
      if (img.matches(EXCLUDE_SELECTORS)) return;
      if (img.closest(".ko-compare")) return;
      if (!img.closest(".post-content")) return;
      if (img.closest("a") && !e.target.closest(".ko-lightbox-expand-btn")) return;

      e.preventDefault();
      e.stopPropagation();
      openLightbox({ type: "image", element: img });
    });
  }

  function addExpandBtn(el, targetForOpen) {
    if (el.querySelector(".ko-lightbox-expand-btn")) return;
    const btn = document.createElement("button");
    btn.className = "ko-lightbox-expand-btn";
    btn.setAttribute("aria-label", "Expand");
    btn.innerHTML = "⛶";
    btn.style.cssText = "position:absolute;top:8px;right:8px;width:36px;height:36px;border:none;background:rgba(0,0,0,.6);color:#fff;border-radius:8px;cursor:pointer;font-size:1.2rem;display:flex;align-items:center;justify-content:center;z-index:2;transition:background .2s";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const glbViewer = targetForOpen.querySelector(".glb-viewer[data-src]");
      if (glbViewer) {
        openLightbox({ type: "model", element: targetForOpen, src: glbViewer.dataset.src || "" });
        return;
      }
      const iframe = targetForOpen.querySelector("iframe");
      const src = iframe?.src;
      const type = src?.includes("figma.com") ? "figma" : src?.includes("maps") ? "maps" : "youtube";
      openLightbox({ type, element: targetForOpen, src: src || "" });
    });
    el.style.position = "relative";
    el.appendChild(btn);
  }

  function wrapEmbedsForLightbox(scope = document) {
    scope.querySelectorAll("iframe[src*='youtube'], iframe[src*='youtu.be'], iframe[src*='google.com/maps'], iframe[src*='maps.google'], iframe[src*='figma.com']").forEach((iframe) => {
      if (iframe.closest(".figma-wrapper") || iframe.closest("[data-ko-embed]")) return;
      const wrap = document.createElement("div");
      wrap.className = "ko-lightbox-embed-wrap";
      wrap.setAttribute("data-ko-embed", "");
      wrap.style.cssText = "position:relative;display:block;margin:1rem 0";
      wrap.innerHTML = iframe.outerHTML;
      addExpandBtn(wrap, wrap);
      iframe.replaceWith(wrap);
    });
    scope.querySelectorAll(".figma-wrapper").forEach((wrap) => {
      if (window.innerWidth <= 1023) return;
      addExpandBtn(wrap, wrap);
    });
  }

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  }

  onReady(() => initLightbox());

  window.koLightbox = {
    init: initLightbox,
    wrapEmbeds: wrapEmbedsForLightbox,
    openModelFullscreen: function (glbViewer) {
      const wrapper = glbViewer.closest(".figma-wrapper") || glbViewer;
      const src = glbViewer.dataset.src || "";
      if (src && window.innerWidth > 1023) openLightbox({ type: "model", element: wrapper, src: src });
    }
  };
})();
