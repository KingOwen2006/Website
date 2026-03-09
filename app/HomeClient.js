"use client";

import HomeScene from "@/components/HomeScene";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import Hero from "@/components/Hero";
import RoadTimeline from "@/components/RoadTimeline";
import ContactSection from "@/components/ContactSection";
import BackToTop from "@/components/BackToTop";

export default function HomeClient({ posts }) {
  return (
    <>
      <HomeScene />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="vignette" />
      <div className="noise" />

      <TopNav />
      <BottomNav />

      <Hero />

      <div className="transition-spacer" />

      <div className="road-section" id="education">
        <div className="road-section-title">
          <h2>Education</h2>
          <p>Units &amp; coursework</p>
        </div>
        <RoadTimeline posts={posts} />
      </div>

      <div className="contact-spacer" id="contact-spacer" />

      <BackToTop />
      <ContactSection />
    </>
  );
}
