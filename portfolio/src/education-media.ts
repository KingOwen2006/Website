import { escapeHTML } from "@portabletext/to-html";

type UnitImage = {
  url?: string;
  alt?: string;
  caption?: string;
  size?: string;
  align?: string;
};

export function createUnitMedia(projectId: string, dataset: string) {
  function imageUrl(url: unknown, width: number) {
    if (typeof url !== "string" || !url.startsWith(`https://cdn.sanity.io/images/${projectId}/${dataset}/`)) return;
    const image = new URL(url);
    image.searchParams.set("w", String(width));
    image.searchParams.set("fit", "max");
    image.searchParams.set("auto", "format");
    return image.href;
  }

  function image(value: UnitImage | null | undefined, width: number, fallbackAlt = "") {
    const src = imageUrl(value?.url, width);
    if (!src) return "";
    return `<img src="${escapeHTML(src)}" alt="${escapeHTML(value?.alt || fallbackAlt)}" loading="lazy" draggable="false">`;
  }

  function caption(value: string | undefined) {
    return value ? `<figcaption class="unit-caption">${escapeHTML(value)}</figcaption>` : "";
  }

  function zoom(value: UnitImage, width: number, className: string) {
    const img = image(value, width);
    if (!img) return "";
    const label = value.alt ? `View image: ${value.alt}` : "View image";
    return `<button class="${className}" type="button" data-unit-zoom aria-label="${escapeHTML(label)}">${img}</button>`;
  }

  function figure(value: UnitImage | null | undefined) {
    if (!value) return "";
    const button = zoom(value, 1200, "unit-image-frame");
    if (!button) return "";
    const align = ["left", "right", "center"].includes(value.align ?? "") ? ` unit-figure--${value.align}` : "";
    const size = value.size === "narrow" ? " unit-figure--narrow" : value.size === "wide" ? " unit-figure--wide" : "";
    return `<figure class="unit-figure${align}${size}">${button}${caption(value.caption)}</figure>`;
  }

  function imageGroup(values: UnitImage[] | null | undefined, kind: "row" | "grid" | "slider", cols = 2) {
    const items = (values ?? []).filter((value) => imageUrl(value?.url, 900));
    if (items.length < 2) return figure(items[0]);
    const slider = kind === "slider" || (kind === "grid" && items.length >= 3);
    const slides = items.map((item) => `<figure>${zoom(item, slider ? 1200 : 900, "unit-gallery-image")}${caption(item.caption)}</figure>`).join("");
    if (!slider) return `<div class="unit-image-grid unit-image-grid--${kind}${kind === "grid" && cols === 3 ? " unit-image-grid--three" : ""}">${slides}</div>`;
    return `<div class="unit-gallery" aria-label="Image gallery" role="group">
      <div class="unit-gallery-track" tabindex="0" aria-label="Gallery images">${slides}</div>
      <div class="unit-gallery-controls">
        <button type="button" data-gallery-step="-1" disabled>Previous</button>
        <span aria-live="polite">1 / ${items.length}</span>
        <button type="button" data-gallery-step="1">Next</button>
      </div>
    </div>`;
  }

  function comparison(value: { before?: UnitImage; after?: UnitImage; caption?: string }) {
    const before = image(value.before, 1400, "Before");
    const after = image(value.after, 1400, "After");
    if (!before || !after) return figure(value.before) || figure(value.after);
    return `<figure class="unit-compare">
      <div class="unit-compare-viewport">
        ${before}${after}
        <span class="unit-compare-handle" aria-hidden="true"></span>
        <input type="range" min="0" max="100" value="50" aria-label="Before and after image comparison">
      </div>
      ${caption(value.caption)}
    </figure>`;
  }

  return { imageUrl, figure, imageGroup, comparison };
}

export function bindUnitMedia(
  body: HTMLElement,
  lightbox: HTMLDialogElement,
  lightboxImage: HTMLImageElement,
) {
  body.addEventListener("input", (event) => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.type === "range") {
      input.parentElement?.style.setProperty("--compare-position", `${input.valueAsNumber}%`);
    }
  });

  body.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const zoom = event.target.closest("[data-unit-zoom]")?.querySelector("img");
    if (zoom) {
      lightboxImage.src = zoom.currentSrc || zoom.src;
      lightboxImage.alt = zoom.alt;
      lightbox.showModal();
      return;
    }
    const button = event.target.closest<HTMLButtonElement>("[data-gallery-step]");
    const gallery = button?.closest(".unit-gallery");
    const track = gallery?.querySelector<HTMLElement>(".unit-gallery-track");
    if (!button || !track) return;
    const index = currentSlide(track) + Number(button.dataset.galleryStep);
    const slide = track.children.item(index) as HTMLElement | null;
    if (slide) track.scrollTo({ left: slide.offsetLeft });
  });

  // Scroll events are captured so the same listener works after each section change.
  body.addEventListener("scroll", (event) => {
    const track = event.target;
    if (!(track instanceof HTMLElement) || !track.matches(".unit-gallery-track")) return;
    const controls = track.parentElement?.querySelector(".unit-gallery-controls");
    if (!controls) return;
    const index = currentSlide(track);
    controls.querySelector<HTMLButtonElement>("[data-gallery-step='-1']")!.disabled = index === 0;
    controls.querySelector<HTMLButtonElement>("[data-gallery-step='1']")!.disabled = index === track.childElementCount - 1;
    const position = controls.querySelector("span")!;
    const label = `${index + 1} / ${track.childElementCount}`;
    if (position.textContent !== label) position.textContent = label;
  }, { capture: true, passive: true });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener("close", () => lightboxImage.removeAttribute("src"));
}

export function unitEmbed(value: { src?: string; href?: string; linkText?: string; embedType?: string }) {
  const label = value.linkText || "Open embedded media";
  const source = value.src === "/mp3/[Insert Name Here] Ep1 FINAL.mp3"
    ? "/assets/unit-5-podcast.mp3" : httpsUrl(value.src)?.href;
  const src = source ? escapeHTML(source) : "";
  const href = httpsUrl(value.href)?.href ?? source;
  if (!href) return "";
  const link = `<a href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>`;
  if (src && value.embedType === "audio") {
    return `<div class="unit-embed unit-embed--audio"><audio src="${src}" controls preload="metadata"></audio>${link}</div>`;
  }
  const url = httpsUrl(source);
  const host = url?.hostname;
  const video = url?.hostname === "www.youtube.com" && url.pathname.startsWith("/embed/");
  if (!src || (!video && !["embed.figma.com", "forms.cloud.microsoft.com", "docs.google.com", "archive.org"].includes(host ?? ""))) {
    return `<p>${link}</p>`;
  }
  return `<div class="unit-embed${video ? " unit-embed--video" : ""}">
    <iframe src="${src}" title="${escapeHTML(label)}" loading="lazy" allowfullscreen></iframe>
    ${link}
  </div>`;
}

function httpsUrl(value: string | undefined) {
  const url = value ? URL.parse(value) : null;
  return url?.protocol === "https:" ? url : null;
}

function currentSlide(track: HTMLElement) {
  const first = track.firstElementChild as HTMLElement;
  const second = first.nextElementSibling as HTMLElement;
  const step = second.offsetLeft - first.offsetLeft;
  return step ? Math.round(track.scrollLeft / step) : 0;
}
