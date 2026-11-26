export type BodyBlock = {
  _type: string;
  style?: string;
  children?: { text?: string }[];
  code?: string;
  label?: string;
  items?: { text?: string; body?: BodyBlock[] }[];
  [key: string]: unknown;
};

function blockText(block: BodyBlock): string {
  switch (block._type) {
    case "block": return (block.children ?? []).map((span) => span.text ?? "").join("");
    case "layoutRow": return (block.items ?? []).flatMap((item) => (item.body ?? []).map(blockText)).join(" ");
    case "columns": return (block.items ?? []).map((item) => item.text ?? "").join(" ");
    case "codeBlock": return block.code ?? "";
    case "buttonBlock": return block.label ?? "";
    default: return "";
  }
}

export function countWords(body: BodyBlock[], includeReferences = false) {
  let count = 0;
  for (const block of body) {
    const text = blockText(block).trim();
    if (!includeReferences && block.style && /^h[1-6]$/.test(block.style) && text.toLowerCase() === "references") break;
    if (text) count += text.split(/\s+/).length;
  }
  return count;
}

export function splitSections(body: BodyBlock[]) {
  if (!body.some((block) => block._type === "block" && block.style === "h2")) return [];
  const sections: { title: string; slug: string; blocks: BodyBlock[]; excerpt: string }[] = [];
  let current: { title: string; blocks: BodyBlock[] } = { title: "Introduction", blocks: [] };
  const parts = [current];
  for (const block of body) {
    if (block._type === "block" && block.style === "h2") {
      current = { title: blockText(block).trim() || "Section", blocks: [] };
      parts.push(current);
    }
    current.blocks.push(block);
  }
  const used = new Set(["full"]);
  for (const part of parts) {
    if (!part.blocks.some((block) => block._type !== "block" || blockText(block).trim())) continue;
    const base = part.title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "section";
    let slug = base;
    for (let suffix = 2; used.has(slug); suffix += 1) slug = `${base}-${suffix}`;
    used.add(slug);
    const text = part.blocks.filter(({ style }) => !style || !/^h[1-6]$/.test(style))
      .map(blockText).join(" ").replace(/\s+/g, " ").trim();
    sections.push({ ...part, slug, excerpt: text.length > 220 ? `${text.slice(0, 220).trim()}…` : text });
  }
  return sections;
}
