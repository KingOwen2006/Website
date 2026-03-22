"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SCROLL_THRESHOLD = 400;

export default function BackToTop({ forPosts = false }) {
  const [visible, setVisible] = useState(false);
  const forPostsRef = useRef(forPosts);
  forPostsRef.current = forPosts;

  useEffect(() => {
    const update = () => {
      if (forPostsRef.current) {
        setVisible(window.scrollY > SCROLL_THRESHOLD);
      } else {
        const contact = document.getElementById("contact-section");
        if (!contact) return;
        const rect = contact.getBoundingClientRect();
        setVisible(rect.top < window.innerHeight * 0.6);
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const goTop = useCallback(() => {
    if (forPostsRef.current) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const el = document.getElementById("about");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
