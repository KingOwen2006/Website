export function getWordCount(html) {
  if (typeof document === "undefined") return 0;
  const temp = document.createElement("div");
  temp.innerHTML = html;
  temp
    .querySelectorAll(
      "iframe, img, video, audio, figure, script, style, .embed-mobile-link",
    )
    .forEach((el) => el.remove());
  const refs = [...temp.querySelectorAll("h1, h2, h3")].find(
    (h) => h.textContent.trim().toLowerCase() === "references",
  );
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

export function enhanceImageCompare(scope) {
  scope
    .querySelectorAll("figure.wp-block-jetpack-image-compare")
    .forEach((figure, index) => {
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
        wrapper.style.setProperty(
          "--pos",
          `${Math.max(0, Math.min(100, Number(value)))}%`,
        );
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
