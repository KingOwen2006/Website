"use client";

import { useState } from "react";
import Link from "next/link";
import PostScene from "@/components/PostScene";
import PostContent from "@/components/PostContent";
import SettingsPopup from "@/components/SettingsPopup";
import GlbViewerLoader from "@/components/GlbViewerLoader";
import LightboxLoader from "@/components/LightboxLoader";

export default function PostPageClient({ post, error }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <PostScene />
      <div className="vignette" />
      <div className="noise" />
      <GlbViewerLoader />
      <LightboxLoader />

      <div className="back-bar">
        <Link href="/" className="back-link">
          <svg viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </Link>
        <button
          className="back-bar__settings"
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
      </div>

      <SettingsPopup
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <div className="page-wrap">
        {error ? (
          <div id="post">
            <div
              style={{
                textAlign: "center",
                padding: "3rem 2rem",
                color: "var(--text-muted)",
              }}
            >
              <p style={{ marginBottom: "0.5rem" }}>Failed to load post.</p>
              <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>{error}</p>
            </div>
          </div>
        ) : post ? (
          <PostContent post={post} />
        ) : (
          <div id="post">
            <div className="ko-wp-lazy-skeleton">
              <div className="ko-wp-lazy-skeleton__bar ko-wp-lazy-skeleton__bar--title" />
              <div className="ko-wp-lazy-skeleton__bar ko-wp-lazy-skeleton__bar--meta" />
              <div className="ko-wp-lazy-skeleton__block">
                <div className="ko-wp-lazy-skeleton__bar" />
                <div className="ko-wp-lazy-skeleton__bar" />
                <div className="ko-wp-lazy-skeleton__bar ko-wp-lazy-skeleton__bar--short" />
                <div className="ko-wp-lazy-skeleton__bar" />
                <div className="ko-wp-lazy-skeleton__bar ko-wp-lazy-skeleton__bar--med" />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
