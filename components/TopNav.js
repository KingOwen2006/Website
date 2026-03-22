"use client";

import { useState, useEffect, useCallback } from "react";
import SettingsPopup from "./SettingsPopup";

export default function TopNav({ sections }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("about");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const hrefMap = {
    about: "about",
    education: "education",
    contact: "contact-section",
  };

  return (
    <>
      <nav className={`top-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="top-nav__links">
          {(sections || [
            { key: "about", label: "About" },
            { key: "education", label: "Education" },
            { key: "contact", label: "Contact" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              className={`top-nav__link ${active === key ? "active" : ""}`}
              onClick={() => scrollTo(hrefMap[key] || key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="top-nav__settings"
          aria-label="Settings"
          onClick={() => setSettingsOpen(true)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </nav>
      <SettingsPopup
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
