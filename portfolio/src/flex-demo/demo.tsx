import { useState } from "react";
import { createRoot } from "react-dom/client";
import { FlexLayout } from "./FlexLayout";
import { useDevicePosture } from "./useDevicePosture";
import "../preferences";
import "../preferences.css";
import "./demo.css";

const finishes = [
  { name: "Blue", src: "/assets/bmw-e30-hero-1440.webp" },
  { name: "Coral", src: "/assets/bmw-e30-hero-coral-1440.webp" },
  { name: "Mint", src: "/assets/bmw-e30-hero-mint-1440.webp" },
] as const;

function Demo({ forced, hasApi }: { forced: boolean; hasApi: boolean }) {
  const { posture, isFlex } = useDevicePosture();
  const [finish, setFinish] = useState<(typeof finishes)[number]>(finishes[0]);
  const api = hasApi ? "available" : posture === "unsupported" ? "unavailable" : "unavailable (CSS fallback)";
  return <FlexLayout isFlex={isFlex} forceFlex={forced}
    top={<section className="studio" aria-labelledby="title">
      <header><a href="/">King Owen</a><span>Fold layout demo</span></header>
      <h1 id="title">BMW E30 M3</h1>
      <figure>
        <img src={finish.src} alt={`BMW E30 M3 rendered in ${finish.name.toLowerCase()} paint`} />
        <figcaption>Body colour study</figcaption>
      </figure>
    </section>}
    bottom={<section className="desk" aria-label="Render controls and notes">
      <fieldset><legend>Paint finish</legend>
        {finishes.map(option => <label key={option.name}>
          <input type="radio" name="finish" checked={finish === option}
            onChange={() => setFinish(option)} /> {option.name}
        </label>)}
      </fieldset>
      <h2>Render notes</h2>
      <ul><li>Compare the body colours under the same lighting.</li>
        <li>Check the shadow along the lower door and sill.</li></ul>
      <p className="badge" role="status">Posture: {posture} · JS API: {api}{forced && " · Forced layout"}</p>
      <a href={forced ? "/flex-demo/" : "?forceFlex=1"}>{forced ? "Use device posture" : "Force stacked panes"}</a>
    </section>}
  />;
}

const root = document.getElementById("demo");
if (root) createRoot(root).render(<Demo
  forced={new URLSearchParams(location.search).get("forceFlex") === "1"}
  hasApi={"devicePosture" in navigator && !!navigator.devicePosture}
/>);
