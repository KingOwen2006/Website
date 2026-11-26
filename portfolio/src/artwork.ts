type Layer = {
  file: string;
  inset: string;
  trim?: string;
  transform?: string;
};

// The portrait is assembled from the original Figma vectors in their drawing order.
const portraitLayers: Layer[] = [
  { file: "neck", inset: "62.24% 26.04% 4.38% 24.01%", trim: "-.39% -.31% -.38% -.31%" },
  { file: "head", inset: "15.38% 28.75% 28.37% 24.75%", trim: "-.23% -.33%" },
  { file: "vector39", inset: "40.13% 37.33% 57.89% 52.85%", trim: "-6.48% -.68% -4.36% -1.17%" },
  { file: "vector40", inset: "37.72% 35.71% 60.06% 51.61%", trim: "-1.44% 0 -1.36% -.22%" },
  { file: "ellipse11", inset: "45.52% 40.19% 53.86% 59.07%" },
  { file: "mouth", inset: "58.25% 42.98% 36.3% 40.82%", trim: "-1.73% -.9% -1.73% -.87%", transform: "rotate(-3deg)" },
  { file: "nose", inset: "50.06% 50.01% 44.78% 47.66%", trim: "-.12% -5.52% -.68% -6.66%" },
  { file: "eye", inset: "41.49% 35.96% 52.72% 53.6%", trim: "-3.32% -2.23% -.35% -2.19%" },
  { file: "vector41", inset: "40.13% 56.35% 57.89% 33.83%", trim: "-6.48% -.68% -4.36% -1.17%", transform: "scaleX(-1)" },
  { file: "vector42", inset: "37.72% 55.11% 60.06% 32.21%", trim: "-1.44% 0 -1.36% -.22%", transform: "scaleX(-1)" },
  { file: "eye1", inset: "41.49% 57.1% 52.83% 32.46%", trim: "-3.39% -2.23% -2.19% -2.19%", transform: "scaleX(-1)" },
  { file: "neck1", inset: "76.75% 0 0", trim: "-.89% -.21% -.55% -.21%" },
  { file: "vector43", inset: "77.05% 28.01% 15.51% 64.3%" },
  { file: "vector44", inset: "82.89% 33.48% 11.67% 54.68%", trim: "-3.31% -1.84% -2.9% -1.61%" },
  { file: "vector45", inset: "83.1% 54.86% 11.46% 33.3%", trim: "-3.17% -1.77% -2.8% -1.56%", transform: "scaleX(-1)" },
  { file: "vector46", inset: "78.38% 71.11% 20.85% 28.28%", trim: "-22.98% -35.27%" },
  { file: "vector47", inset: "90.8% 7.48% 1.64% 85.89%" },
  { file: "ears", inset: "42.01% 26.76% 44.74% 66.03%", trim: "-.97% -2.16% -.97% -2.82%" },
  { file: "ears1", inset: "42.01% 70.27% 44.74% 22.52%", trim: "-.97% -2.16% -.97% -2.82%", transform: "scaleX(-1)" },
  { file: "vector48", inset: "46.59% 29.02% 47.66% 67.12%" },
  { file: "vector49", inset: "46.6% 71.35% 47.65% 24.8%", transform: "scaleX(-1)" },
  { file: "head1", inset: "63.23% 38.17% 23.25% 35.07%" },
  { file: "hair", inset: "0 14.58% 49.43% 8.59%", trim: "-.25% -.41% -.43% -.51%" },
];

const hairDetails = [
  [50, 51.91, 0, 32.637, 34.049, 32.637, 34.049, 0, "-1.47% -1.53% 0 -1.53%"],
  [51, 58.59, 4.32, 46.891, 47.064, 32.637, 34.049, 40.03, "-1.47% -1.53% -.38% -1.48%"],
  [52, 56.53, 5.99, 134.453, 93.599, 71.323, 123.059, 101.06, "-.41% -.7% -.19% -.63%"],
  [53, 132.39, 83.08, 64.461, 60.739, 27.687, 61.119, 130.48, "-.82% -1.81% -.38% -1.75%"],
  [54, 54.67, 38.04, 34.405, 32.413, 24.863, 28.003, 108.35, "-1.79% -2.01% -.87% -1.75%"],
  [55, 28.85, 44, 30.808, 33.111, 24.863, 28.003, 166.25, "-1.79% -2.01% -.87% -1.75%"],
  [56, 13.1, 38.39, 32.918, 19.947, 19.068, 32.409, 91.57, "-1.54% -2.62% 0 -2.62%"],
  [57, 0, 46.66, 51.737, 53.325, 44.947, 42.841, 77.19, "-1.17% -1.11% -.57% -.97%"],
] as const;

const figmaLayers: Layer[] = [
  { file: "vector", inset: "33.5% .51% 33.5% 50%" },
  { file: "vector1", inset: "66.5% 50% .51% .51%" },
  { file: "vector2", inset: ".51% .51% 66.5% 50%" },
  { file: "vector3", inset: ".51% 50% 66.5% .51%" },
  { file: "vector4", inset: "33.5% 50% 33.5% .51%" },
];

function layeredImage(file: string, trim = "0") {
  return `<span class="art-layer" style="inset:${trim}"><img src="/assets/${file}.svg" alt="" loading="lazy"></span>`;
}

function showLayer({ file, inset, trim, transform = "none" }: Layer) {
  return `<span class="art-layer" style="inset:${inset};transform:${transform}">${layeredImage(file, trim)}</span>`;
}

export function portrait(label?: string) {
  const details = hairDetails.map(([file, x, y, boxWidth, boxHeight, width, height, rotate, trim]) => {
    const left = 100 * (69.03 + x + (boxWidth - width) / 2) / 322;
    const top = 100 * (19.46 + y + (boxHeight - height) / 2) / 390;
    const transform = `rotate(${rotate}deg) scaleY(${file >= 56 ? -1 : 1})`;
    return `<span class="art-layer" style="left:${left}%;top:${top}%;width:${100 * width / 322}%;height:${100 * height / 390}%;transform:${transform}">${layeredImage(`vector${file}`, trim)}</span>`;
  }).join("");

  return `<div class="portrait" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}><div class="portrait-art">${portraitLayers.map(showLayer).join("")}${details}</div></div>`;
}

export function figmaMark() {
  return `<span class="figma-mark" aria-hidden="true">${figmaLayers.map(showLayer).join("")}</span>`;
}
