"use client";

import { useEffect, useRef } from "react";

const EMBED_REPLACEMENTS = {
  "Interactive-Ship-Here": { type: "model", src: "/Models/Unit3ShipDone.glb", linkText: "Download" },
  "Unit1-moodboard1-here": { type: "figma", src: "https://embed.figma.com/board/F0BfcSQpK4EtYVEtlb9lwV/Mood-Board?node-id=0-1&embed-host=share", linkText: "Open Mood Board in Figma" },
  "Unit1-moodboard2-here": { type: "figma", src: "https://embed.figma.com/board/nj3rvRhnhGHPoojzJFonxh/Cannon-Board?embed-host=share", linkText: "Open Cannon Board in Figma" },
  "Unit1-form-here": { type: "embed", src: "https://forms.cloud.microsoft.com/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUOFRVVUhTMUswUzBEWTBVTjQzQzY5NVJWWS4u&embed=true", linkText: "Open Form" },
  "Unit1-formANS-here": { type: "embed", src: "https://forms.cloud.microsoft.com/Pages/AnalysisPage.aspx?AnalyzerToken=GWhIwVOBfSGiYbBrbwU8McqYnS87Sl6e&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUOFRVVUhTMUswUzBEWTBVTjQzQzY5NVJWWS4u", linkText: "Open Form Analysis" },
  "Unit2-form-here": { type: "embed", src: "https://forms.cloud.microsoft.com/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUNFVHSVU4VzRCMlVNTTExOUFONTNYRjBJMC4u&embed=true", linkText: "Open Form" },
  "Unit2-formANS-here": { type: "embed", src: "https://forms.cloud.microsoft.com/Pages/AnalysisPage.aspx?AnalyzerToken=NbUyeN4dPXxMzyc26vZW5IeiKhlXnoAO&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUNFVHSVU4VzRCMlVNTTExOUFONTNYRjBJMC4u", linkText: "Open Form Analysis" },
  "Unit4-moodboard-here": { type: "figma", src: "https://embed.figma.com/board/vC87CfHAXm2Hl2MSUYLsQa/Twine-Mood-board?node-id=0-1&embed-host=share", linkText: "Open Twine Mood Board in Figma" },
  "Unit4-form-here": { type: "embed", src: "https://forms.cloud.microsoft.com/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUN09ZNUZRVTNZODZJSlJBTDA0QThDREtIRS4u&embed=true", linkText: "Open Form" },
  "Unit4-formANS-here": { type: "embed", src: "https://forms.cloud.microsoft.com/Pages/AnalysisPage.aspx?AnalyzerToken=IqfQOSxrfkVAFynsgvV5N4Dns5EQYF1f&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUN09ZNUZRVTNZODZJSlJBTDA0QThDREtIRS4u", linkText: "Open Form Analysis" },
};

function embedBlock(src, linkText) {
  const figmaUrl = src.replace("embed.figma.com", "www.figma.com").split("?")[0];
  const href = src.includes("figma.com") ? figmaUrl : src.replace("&embed=true", "");
  return `<div class="figma-wrapper">
    <iframe src="${src}"></iframe>
    <a href="${href}" target="_blank" rel="noopener" class="embed-mobile-link">${linkText}</a>
  </div>`;
}

function modelEmbedBlock(src, linkText) {
  return `<div class="figma-wrapper model-viewer-wrapper" data-ko-embed="model">
    <div class="glb-viewer" data-glb-viewer data-src="${src}">
      <canvas class="glb-viewer__canvas"></canvas>
    </div>
    <a href="${src}" target="_blank" rel="noopener" download class="embed-mobile-link">${linkText}</a>
  </div>`;
}

function replaceEmbeds(content) {
  for (const [key, val] of Object.entries(EMBED_REPLACEMENTS)) {
    if (val.type === "model") {
      content = content.replaceAll(key, modelEmbedBlock(val.src, val.linkText));
    } else {
      content = content.replaceAll(key, embedBlock(val.src, val.linkText));
    }
  }
  return content;
}

function getWordCount(html) {
  if (typeof document === "undefined") return 0;
  const temp = document.createElement("div");
  temp.innerHTML = html;
  temp.querySelectorAll("iframe, img, video, audio, figure, script, style, .embed-mobile-link").forEach((el) => el.remove());
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

function enhanceImageCompare(scope) {
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

export default function PostContent({ post }) {
  const contentRef = useRef(null);

  const rawContent = post?.content?.rendered || post?.content || "";
  const processedContent = replaceEmbeds(rawContent);

  useEffect(() => {
    if (!contentRef.current) return;
    const scope = contentRef.current;

    const wordCountEl = scope.parentElement?.querySelector(".word-count");
    if (wordCountEl) {
      const count = getWordCount(processedContent);
      wordCountEl.textContent = `Word count: ${count}`;
    }

    enhanceImageCompare(scope);

    scope.querySelectorAll("iframe[src*='figma.com']").forEach((old) => {
      old.replaceWith(old.cloneNode(true));
    });

    if (window.initGlbViewers) window.initGlbViewers(scope);
  }, [processedContent]);

  const title = post?.title?.rendered || post?.title || "Untitled";

  return (
    <div id="post">
      <h1 dangerouslySetInnerHTML={{ __html: title }} />
      <p className="word-count">Loading word count...</p>
      <div
        ref={contentRef}
        className="post-content"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </div>
  );
}
