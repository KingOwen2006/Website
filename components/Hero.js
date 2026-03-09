"use client";

import DiscordPresence, { ActivityCard } from "./DiscordPresence";

export default function Hero() {
  const { status, avatarUrl, activityLines, badgeLabel, statusLabel } =
    DiscordPresence({});

  return (
    <div className="hero-section" id="about">
      <div className="col-left">
        <div className="avatar-wrap">
          <div className="avatar-glow" />
          <a
            href="https://discord.com/users/798619259206500365"
            target="_blank"
            rel="noopener"
            className="avatar-frame avatar-frame--link"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="discord-avatar" src={avatarUrl} alt="KingOwen" />
          </a>
          <div className={`status-badge is-${status}`}>{badgeLabel}</div>
        </div>
        <div className="greeting">Hey there, I&apos;m</div>
        <div className="display-name" style={{ fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>KingOwen</div>
        <div className="subtitle">3D Modeller &amp; Digital Creator</div>
        <div className="username-row">
          <span className="uname">@kingowen2006</span>
          <a
            href="https://discord.gg/X6qsHwR9Sj"
            target="_blank"
            rel="noopener"
            className="guild-chip"
          >
            TJG
          </a>
        </div>
      </div>

      <div className="col-right">
        <div className="glass-card">
          <h3>About Me</h3>
          <p>
            I&apos;m <strong>Owen</strong>, a 19-year-old 3D modeller from the
            United Kingdom. I specialise in crafting high-quality 3D models,
            sculpts, and rendered environments. From detailed character models
            to immersive worlds — I thrive on turning concepts into tangible
            digital creations and I&apos;m always pushing to improve my skills.
          </p>
          <div className="divider" />
          <div className="skills">
            <span className="skill">Blender</span>
            <span className="skill">3D Modelling</span>
            <span className="skill">Name: Owen</span>
            <span className="skill">Age: 19</span>
            <span className="skill">Location: UK</span>
            <span className="skill">Platform: Desktop</span>
            <span className="skill">Discord: {statusLabel}</span>
          </div>
        </div>
        <ActivityCard status={status} activityLines={activityLines} />
      </div>

      <div className="scroll-hint">
        <span>Scroll</span>
        <svg viewBox="0 0 24 24">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
