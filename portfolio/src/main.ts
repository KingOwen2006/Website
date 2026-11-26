import "./styles.css";
import { figmaMark, portrait } from "./artwork";
import { installCarousel } from "./carousel";
import { categories, projects, type Artwork, type Card } from "./content";
import { loadFeed } from "./feed";
import { element, icon, mountNavigation } from "./navigation";

mountNavigation("home");

element("#about-portrait").innerHTML = portrait("Illustrated portrait of Owen Moore");

function tool(name: string, style: string, artwork: string) {
  return `<div class="tool tool-${style}" tabindex="0" role="img" aria-label="${name}">
    <div class="tool-art" aria-hidden="true">${artwork}</div>
    <span class="tool-label" aria-hidden="true">${name}</span>
  </div>`;
}

function toolImage(file: string, width?: number, height?: number) {
  const dimensions = width && height ? ` width="${width}" height="${height}"` : "";
  return `<img src="/assets/${file}"${dimensions} alt="" loading="lazy">`;
}

const toolsPanel = element("#tools");
toolsPanel.innerHTML = `
  ${tool("Bambu Lab", "bambu", toolImage("image9.png", 192, 192))}
  ${tool("Blender", "blender", toolImage("image6.png", 1080, 894))}
  ${tool("Unreal Engine", "unreal", toolImage("image7-vectorized.svg"))}
  <div class="tool-grid">
    ${tool("UPBGE", "upbge", toolImage("image5.png", 778, 778))}
    ${tool("Figma", "figma", figmaMark())}
    ${tool("Visual Studio Code", "vscode", toolImage("image21.png", 1080, 1080))}
    ${tool("X / Twitter", "x", toolImage("xlogo-svg.svg"))}
  </div>
`;

const projectTrack = element("#project-cards");
const feedTrack = element("#feed-cards");
const dialog = element<HTMLDialogElement>(".detail-dialog");
const dialogBody = element("#detail-content");
const closeDialogButton = element<HTMLButtonElement>(".dialog-close");
const refreshProjects = installCarousel(projectTrack, dialog);
const refreshFeed = installCarousel(feedTrack, dialog);
let dialogReturnTarget: HTMLElement | undefined;
let dialogReturnHash = "#home";

closeDialogButton.innerHTML = icon("close");

function artwork(kind: Artwork) {
  switch (kind) {
    case "car": return toolImage("image2.png", 1207, 674);
    case "portrait": return portrait();
    case "print": return toolImage("image9.png", 192, 192);
    case "website": return toolImage("frame16.png", 4096, 2304);
    case "twidget": return toolImage("twidget-cover.png", 1024, 500);
  }
}

function cardMarkup(card: Card) {
  const contribution = card.contribution;
  const detail = `#project/${card.id}`;
  const title = contribution ? `<a class="card-action project-title-link" href="${detail}">${card.title}</a>` : card.title;
  const actions = contribution ? `<div class="project-link-group">${contribution.actions.map((action) =>
    `<a class="icon-button card-action" href="${action.href}" target="_blank" rel="noopener noreferrer" aria-label="${action.label}"><img src="/assets/${action.icon}" alt="" width="24" height="24"></a>`,
  ).join("")}</div>` : `<a class="icon-button card-action" href="${detail}" aria-label="Open ${card.title}">${icon("open")}</a>`;
  return `<article class="card artwork-${card.artwork}">
    <div class="card-art" aria-hidden="true">${artwork(card.artwork)}</div>
    <span class="card-category">${contribution ? "Contributed" : categories[card.category]}</span>
    <div class="card-caption">
      ${contribution ? `<img class="project-app-icon" src="/assets/${contribution.icon}" alt="" width="80" height="80" loading="lazy">` : ""}
      <div><h3>${title}</h3><p>${card.summary}</p></div>
      ${actions}
    </div>
  </article>`;
}

projectTrack.innerHTML = projects.map(cardMarkup).join("");
refreshProjects();
void loadFeed(feedTrack, element("#feed-status"), refreshFeed);

const sections = [...document.querySelectorAll<HTMLElement>("main > section")];

function showDetails() {
  const hash = location.hash;
  if (hash === "#education") {
    location.replace("/education/");
    return;
  }
  const [section, id] = hash.slice(1).split("/");
  const card = section === "project" ? projects.find((entry) => entry.id === id) : undefined;
  if (hash !== "#shop" && !card) {
    if (dialog.open) dialog.close();
    return;
  }

  dialogBody.innerHTML = card ? `
    <div class="dialog-art artwork-${card.artwork}" aria-hidden="true">${artwork(card.artwork)}</div>
    <div class="detail-copy">
      <h2 id="detail-title">${card.title}</h2>
      <p>${card.description}</p>
      ${card.link ? `<a class="detail-link" href="${card.link.href}">${card.link.label}</a>` : ""}
    </div>
  ` : `
    <div class="detail-copy shop-copy">
      <h2 id="detail-title">Shop</h2>
      <p>No products are listed yet.</p>
      <a class="detail-link" href="#project/3d-printing">Explore 3D printing</a>
    </div>
  `;

  if (!dialog.open) dialog.showModal();
  closeDialogButton.focus();
}

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
  if (!link || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

  if (link.hash === "#shop" || link.hash.startsWith("#project/")) {
    if (!dialog.open) {
      const copy = link.closest("[data-carousel-copy]");
      const originals = copy?.parentElement?.querySelectorAll<HTMLAnchorElement>(".card:not([data-carousel-copy]) .card-action");
      dialogReturnTarget = originals ? [...originals].find((item) => item.hash === link.hash) : link;
      const section = sections.find((item) => item.getBoundingClientRect().bottom > window.innerHeight / 2);
      dialogReturnHash = `#${section?.id ?? "feed"}`;
    }
    if (location.hash === link.hash) showDetails();
  }
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener("close", () => {
  if (location.hash === "#shop" || location.hash.startsWith("#project/")) {
    history.replaceState(null, "", dialogReturnHash);
    dialogReturnTarget?.focus();
  }
  dialogReturnTarget = undefined;
});

window.addEventListener("hashchange", showDetails);
showDetails();
