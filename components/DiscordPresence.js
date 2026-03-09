"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const DISCORD_USER_ID = "798619259206500365";
const STATUS_LABELS = { online: "Online", idle: "Idle", dnd: "Do Not Disturb", offline: "Offline" };
const BADGE_LABELS = { online: "Online", idle: "Idle", dnd: "DND", offline: "Offline" };
const ACTIVITY_TYPES = { 0: "Playing", 1: "Streaming", 2: "Listening to", 3: "Watching", 4: "", 5: "Competing in" };

const workApps = ["Cursor", "Blender", "Visual Studio Code", "VS Code"];
const musicApps = ["YouTube Music", "Spotify", "Apple Music", "SoundCloud", "Deezer", "Tidal"];

const isWorkApp = (a) => workApps.some((w) => a.name.toLowerCase().includes(w.toLowerCase()));
const isMusicApp = (a) => musicApps.some((m) => a.name.toLowerCase().includes(m.toLowerCase())) || a.type === 2;

function parseTitleArtist(details) {
  if (!details) return { title: "", artist: "" };
  const primary = details.split(",")[0].trim();
  let idx = primary.indexOf(" - ");
  if (idx !== -1) return { title: primary.slice(0, idx).trim(), artist: primary.slice(idx + 3).trim() };
  idx = primary.toLowerCase().indexOf(" by ");
  if (idx !== -1) return { title: primary.slice(0, idx).trim(), artist: primary.slice(idx + 4).trim() };
  return { title: primary, artist: "" };
}

function getActivityDisplay(a) {
  if (isWorkApp(a)) return "Working on a project";
  if (isMusicApp(a)) {
    const d = (a.details || "").trim();
    const s = (a.state || "").trim();
    let title = "", artist = "";
    if (a.name.toLowerCase().includes("spotify") && d) { title = d; artist = s; }
    else if (a.name.toLowerCase().includes("youtube music") && d) {
      const p = parseTitleArtist(d); title = p.title; artist = p.artist;
      if (!artist && s && s.toLowerCase() !== title.toLowerCase()) artist = s;
    } else if (d) { const p = parseTitleArtist(d); title = p.title; artist = p.artist || s; }
    else { title = s || a.name; }
    const song = [title, artist].filter(Boolean).join(" — ");
    return song ? `Song: ${song}` : "Song: Unknown";
  }
  const prefix = ACTIVITY_TYPES[a.type] || "Playing";
  return prefix ? `${prefix} ${a.name}` : a.name;
}

export default function DiscordPresence({ onPresenceUpdate }) {
  const [status, setStatus] = useState("offline");
  const [avatarUrl, setAvatarUrl] = useState(
    `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/0ad237bf4f0123c5be52925363b4c6cc.png?size=512`
  );
  const [activityLines, setActivityLines] = useState(["Sleeping \u{1F4A4}"]);

  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      if (!d.success || !d.data) return;

      const data = d.data;
      const user = data.discord_user;
      const st = data.discord_status || "offline";
      setStatus(st);

      if (user.avatar) {
        const ext = user.avatar.startsWith("a_") ? "gif" : "png";
        setAvatarUrl(
          `https://cdn.discordapp.com/avatars/${DISCORD_USER_ID}/${user.avatar}.${ext}?size=512`
        );
      }

      const activities = data.activities || [];
      const customStatus = activities.find((a) => a.type === 4);
      const realActivities = activities.filter((a) => a.type !== 4);
      let lines = [];

      if (st === "offline") {
        if (customStatus) {
          lines = [`${customStatus.emoji?.name || ""} ${customStatus.state || ""}`.trim()];
        } else {
          lines = ["Sleeping \u{1F4A4}"];
        }
      } else if (realActivities.length > 0) {
        const seen = new Set();
        for (const a of realActivities) {
          const line = getActivityDisplay(a);
          if (!line || seen.has(line)) continue;
          seen.add(line);
          lines.push(line);
        }
      } else {
        if (customStatus) {
          lines = [`${customStatus.emoji?.name || ""} ${customStatus.state || ""}`.trim()];
        } else {
          lines = ["Chilling \u2728"];
        }
      }

      setActivityLines(lines.slice(0, 3));
      if (onPresenceUpdate) onPresenceUpdate({ status: st, avatarUrl });
    } catch {
      setActivityLines(["Unavailable"]);
    }
  }, [onPresenceUpdate, avatarUrl]);

  useEffect(() => {
    fetchPresence();
    const interval = setInterval(fetchPresence, 30000);
    return () => clearInterval(interval);
  }, [fetchPresence]);

  return { status, avatarUrl, activityLines, badgeLabel: BADGE_LABELS[status] || status, statusLabel: STATUS_LABELS[status] || status };
}

export function ActivityCard({ status, activityLines }) {
  return (
    <div className="glass-card">
      <div className="activity-card">
        <div className="pulse discord-status-dot" data-status={status} />
        <div className="activity-card__body">
          <div className="meta">Current Activity</div>
          <div className="discord-activity-text">
            {activityLines.map((line, i) => (
              <ActivityLine key={i} text={line} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityLine({ text }) {
  const lineRef = useRef(null);
  const innerRef = useRef(null);
  const [marquee, setMarquee] = useState(false);

  useEffect(() => {
    if (innerRef.current && lineRef.current) {
      setMarquee(innerRef.current.scrollWidth > lineRef.current.clientWidth);
    }
  }, [text]);

  return (
    <div
      ref={lineRef}
      className={`discord-activity-line ${marquee ? "is-marquee" : ""}`}
    >
      <span ref={innerRef} className="discord-activity-text-inner">
        {marquee ? `${text}   \u2022   ${text}` : text}
      </span>
    </div>
  );
}
