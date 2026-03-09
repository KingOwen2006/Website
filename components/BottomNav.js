"use client";

import { useState, useEffect, useCallback } from "react";

export default function BottomNav() {
  const [active, setActive] = useState("about");

  useEffect(() => {
    const updateActive = () => {
      const vc = window.scrollY + window.innerHeight * 0.5;
      const edu = document.getElementById("education");
      const contact = document.getElementById("contact-section");
      if (edu && contact) {
        if (vc < edu.offsetTop) setActive("about");
        else if (vc < contact.offsetTop) setActive("education");
        else setActive("contact");
      }
    };
    window.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
    return () => window.removeEventListener("scroll", updateActive);
  }, []);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const hrefMap = { about: "about", education: "posts", contact: "contact-section" };

  return (
    <nav className="bottom-nav">
      {[
        { key: "about", label: "About" },
        { key: "education", label: "Education" },
        { key: "contact", label: "Contact" },
      ].map(({ key, label }) => (
        <button
          key={key}
          className={`bottom-nav__link ${active === key ? "active" : ""}`}
          onClick={() => scrollTo(hrefMap[key])}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
