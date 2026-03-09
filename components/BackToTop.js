"use client";

import { useState, useEffect, useCallback } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const contact = document.getElementById("contact-section");
      if (!contact) return;
      const rect = contact.getBoundingClientRect();
      setVisible(rect.top < window.innerHeight * 0.6);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const goTop = useCallback(() => {
    const el = document.getElementById("about");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <button
      className={`back-to-top ${visible ? "visible" : ""}`}
      aria-label="Back to top"
      onClick={goTop}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}
