const pixelsPerSecond = 36;
const hoverPixelsPerSecond = 9;
const manualPauseMs = 1200;
const copySelector = "[data-carousel-copy]";

export function installCarousel(track: HTMLElement, dialog: HTMLDialogElement) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false;
  let hovering = false;
  let pointerId: number | undefined;
  let resumeTimer: number | undefined;
  let loopWidth = 0;
  let frame: number | undefined;
  let lastTime: number | undefined;
  let position = 0;
  let appliedScroll = 0;

  function tick(now: number) {
    if (lastTime !== undefined) {
      // Keep fractional progress even when the browser rounds scrollLeft to pixels.
      if (track.scrollLeft !== appliedScroll) position = track.scrollLeft;
      const speed = hovering ? hoverPixelsPerSecond : pixelsPerSecond;
      position = (position + Math.min(now - lastTime, 48) * speed / 1000) % loopWidth;
      track.scrollLeft = position;
      appliedScroll = track.scrollLeft;
    }
    lastTime = now;
    frame = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    const canPlay = loopWidth > 0 && visible && !reducedMotion.matches && pointerId === undefined
      && resumeTimer === undefined && !track.matches(":focus-within") && !dialog.open && !document.hidden;
    if (canPlay && frame === undefined) {
      position = appliedScroll = track.scrollLeft;
      frame = requestAnimationFrame(tick);
    } else if (!canPlay && frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = lastTime = undefined;
    }
  }

  function pauseAfterInput() {
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(() => {
      resumeTimer = undefined;
      syncPlayback();
    }, manualPauseMs);
    syncPlayback();
  }

  function measure() {
    const originals = [...track.children].filter((card) => !card.matches(copySelector));
    const first = originals[0];
    const last = originals.at(-1);
    const copies = [...track.querySelectorAll<HTMLElement>(copySelector)];

    if (first && last && first !== last && track.clientWidth > 0) {
      const gap = parseFloat(getComputedStyle(track).columnGap);
      const cycleWidth = last.getBoundingClientRect().right - first.getBoundingClientRect().left + gap;
      // Wide viewports may need more than one repeated cycle to keep the track filled.
      const copyCount = Math.ceil(track.clientWidth / cycleWidth) * originals.length;
      if (copies.length < copyCount) {
        const newCopies = Array.from({ length: copyCount - copies.length }, (_, index) => {
          const copy = originals[(copies.length + index) % originals.length].cloneNode(true) as HTMLElement;
          copy.dataset.carouselCopy = "";
          copy.setAttribute("aria-hidden", "true");
          copy.querySelectorAll<HTMLElement>("a, button, [tabindex]").forEach((item) => { item.tabIndex = -1; });
          return copy;
        });
        track.append(...newCopies);
        copies.push(...newCopies);
      }
      copies.slice(copyCount).forEach((copy) => copy.remove());
      loopWidth = copies[0].getBoundingClientRect().left - first.getBoundingClientRect().left;
    } else {
      copies.forEach((copy) => copy.remove());
      loopWidth = 0;
    }

    track.classList.toggle("card-track-loop", loopWidth > 0);
    syncPlayback();
  }

  reducedMotion.addEventListener("change", syncPlayback);
  track.addEventListener("pointerenter", (event) => {
    hovering = event.pointerType === "mouse" || event.pointerType === "pen";
  });
  track.addEventListener("pointerleave", () => {
    hovering = false;
  });
  track.addEventListener("focusin", syncPlayback);
  track.addEventListener("focusout", () => queueMicrotask(syncPlayback));
  track.addEventListener("wheel", (event) => {
    if (event.deltaX || event.shiftKey) pauseAfterInput();
  }, { passive: true });
  track.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    syncPlayback();
  });
  track.addEventListener("mousedown", (event) => {
    if (event.target instanceof Element && event.target.closest(copySelector)) event.preventDefault();
  });

  function releasePointer(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    pointerId = undefined;
    pauseAfterInput();
  }
  window.addEventListener("pointerup", releasePointer);
  window.addEventListener("pointercancel", releasePointer);
  document.addEventListener("visibilitychange", syncPlayback);

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncPlayback();
  }).observe(track);
  new ResizeObserver(measure).observe(track);
  new MutationObserver(syncPlayback).observe(dialog, { attributes: true, attributeFilter: ["open"] });

  return () => {
    track.scrollLeft = position = appliedScroll = 0;
    measure();
  };
}
