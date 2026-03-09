"use client";

import { useEffect } from "react";

export default function LightboxLoader() {
  useEffect(() => {
    const EXCLUDE_SELECTORS = [
      ".nav-icon", ".theme-toggle__icon", ".ko-home__pfp img",
      ".post-card img", ".road-card img", ".ko-compare__img",
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
      prevBtn.addEventListener("click", (e) => { e.stopPropagation(); navigate(-1); });
      nextBtn.addEventListener("click", (e) => { e.stopPropagation(); navigate(1); });

      document.addEventListener("keydown", (e) => {
        if (!lightbox?.classList.contains("is-open")) return;
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
      currentIndex = (currentIndex + dir + galleryItems.length) % galleryItems.length;
      updateLightbox();
    }

    function setupCompareSlider(wrapper) {
      const viewport = wrapper.querySelector(".ko-compare__viewport");
      if (!viewport) return;
      const sync = (val) => wrapper.style.setProperty("--pos", `${Math.max(0, Math.min(100, val))}%`);
      const update = (x) => { const r = viewport.getBoundingClientRect(); sync(Math.round(((x - r.left) / r.width) * 100)); };
      viewport.addEventListener("pointerdown", (e) => {
        if (e.target?.closest?.("a")) return;
        update(e.clientX);
        const onMove = (ev) => update(ev.clientX);
        const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      });
    }

    function collectGalleryItems() {
      galleryItems = [];
      const scope = document.querySelector(".post-content");
      if (!scope) return;

      scope.querySelectorAll("img").forEach((img) => {
        if (img.matches(EXCLUDE_SELECTORS) || img.closest(".ko-compare") || !img.src || img.src.includes("data:")) return;
        if (img.naturalWidth && img.naturalWidth < 50) return;
        galleryItems.push({ type: "image", element: img });
      });

      scope.querySelectorAll(".ko-compare").forEach((compare) => {
        galleryItems.push({ type: "compare", element: compare });
      });

      scope.querySelectorAll("iframe[src*='youtube'], iframe[src*='youtu.be']").forEach((iframe) => {
        galleryItems.push({ type: "youtube", element: iframe.closest(".figma-wrapper") || iframe, src: iframe.src });
      });

      scope.querySelectorAll("iframe[src*='figma.com']").forEach((iframe) => {
        if (window.innerWidth <= 1023) return;
        galleryItems.push({ type: "figma", element: iframe.closest(".figma-wrapper") || iframe, src: iframe.src });
      });

      galleryItems.sort((a, b) => {
        const pos = a.element.compareDocumentPosition(b.element);
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
      } else if (["youtube", "figma", "maps"].includes(item.type)) {
        const iframe = document.createElement("iframe");
        iframe.src = item.src;
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allowfullscreen", "true");
        lightboxContent.appendChild(iframe);
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

    createLightbox();

    const clickHandler = (e) => {
      const compare = e.target.closest(".ko-compare");
      if (compare?.closest(".post-content")) {
        e.preventDefault(); e.stopPropagation();
        openLightbox({ type: "compare", element: compare });
        return;
      }

      const expandBtn = e.target.closest(".ko-lightbox-expand-btn");
      if (expandBtn) {
        const wrapper = expandBtn.closest(".figma-wrapper, .ko-lightbox-embed-wrap");
        if (wrapper) {
          const iframe = wrapper.querySelector("iframe");
          const src = iframe?.src;
          const type = src?.includes("figma.com") ? "figma" : src?.includes("maps") ? "maps" : "youtube";
          e.preventDefault(); e.stopPropagation();
          openLightbox({ type, element: wrapper, src: src || "" });
          return;
        }
      }

      const img = e.target.closest("img");
      if (!img) return;
      if (img.matches(EXCLUDE_SELECTORS) || img.closest(".ko-compare") || !img.closest(".post-content")) return;
      if (img.closest("a") && !expandBtn) return;
      e.preventDefault(); e.stopPropagation();
      openLightbox({ type: "image", element: img });
    };

    document.addEventListener("click", clickHandler);

    function addExpandBtns(scope) {
      scope.querySelectorAll(".figma-wrapper").forEach((wrap) => {
        if (window.innerWidth <= 1023 || wrap.querySelector(".ko-lightbox-expand-btn")) return;
        const btn = document.createElement("button");
        btn.className = "ko-lightbox-expand-btn";
        btn.setAttribute("aria-label", "Expand");
        btn.innerHTML = "\u26F6";
        wrap.style.position = "relative";
        wrap.appendChild(btn);
      });
    }

    window.koLightbox = { wrapEmbeds: addExpandBtns };

    return () => {
      document.removeEventListener("click", clickHandler);
      if (lightbox) { lightbox.remove(); lightbox = null; }
      delete window.koLightbox;
    };
  }, []);

  return null;
}
