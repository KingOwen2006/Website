export type EmbedType = 'model' | 'figma' | 'embed' | 'audio'

export type EmbedConfig = {
  type: EmbedType
  src: string
  linkText: string
}

export const EMBED_REPLACEMENTS: Record<string, EmbedConfig> = {
  'Interactive-Ship-Here': {
    type: 'model',
    src: '/Models/Unit3ShipDone.glb',
    linkText: 'Download',
  },
  'Unit1-moodboard1-here': {
    type: 'figma',
    src: 'https://embed.figma.com/board/F0BfcSQpK4EtYVEtlb9lwV/Mood-Board?node-id=0-1&embed-host=share',
    linkText: 'Open Mood Board in Figma',
  },
  'Unit1-moodboard2-here': {
    type: 'figma',
    src: 'https://embed.figma.com/board/nj3rvRhnhGHPoojzJFonxh/Cannon-Board?embed-host=share',
    linkText: 'Open Cannon Board in Figma',
  },
  'Unit1-form-here': {
    type: 'embed',
    src: 'https://forms.cloud.microsoft.com/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUOFRVVUhTMUswUzBEWTBVTjQzQzY5NVJWWS4u&embed=true',
    linkText: 'Open Form',
  },
  'Unit1-formANS-here': {
    type: 'embed',
    src: 'https://forms.cloud.microsoft.com/Pages/AnalysisPage.aspx?AnalyzerToken=GWhIwVOBfSGiYbBrbwU8McqYnS87Sl6e&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUOFRVVUhTMUswUzBEWTBVTjQzQzY5NVJWWS4u',
    linkText: 'Open Form Analysis',
  },
  'Unit2-form-here': {
    type: 'embed',
    src: 'https://forms.cloud.microsoft.com/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUNFVHSVU4VzRCMlVNTTExOUFONTNYRjBJMC4u&embed=true',
    linkText: 'Open Form',
  },
  'Unit2-formANS-here': {
    type: 'embed',
    src: 'https://forms.cloud.microsoft.com/Pages/AnalysisPage.aspx?AnalyzerToken=NbUyeN4dPXxMzyc26vZW5IeiKhlXnoAO&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUNFVHSVU4VzRCMlVNTTExOUFONTNYRjBJMC4u',
    linkText: 'Open Form Analysis',
  },
  'Unit4-moodboard-here': {
    type: 'figma',
    src: 'https://embed.figma.com/board/vC87CfHAXm2Hl2MSUYLsQa/Twine-Mood-board?node-id=0-1&embed-host=share',
    linkText: 'Open Twine Mood Board in Figma',
  },
  'Unit4-form-here': {
    type: 'embed',
    src: 'https://forms.cloud.microsoft.com/Pages/ResponsePage.aspx?id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUN09ZNUZRVTNZODZJSlJBTDA0QThDREtIRS4u&embed=true',
    linkText: 'Open Form',
  },
  'Unit4-formANS-here': {
    type: 'embed',
    src: 'https://forms.cloud.microsoft.com/Pages/AnalysisPage.aspx?AnalyzerToken=IqfQOSxrfkVAFynsgvV5N4Dns5EQYF1f&id=0JsvSSEvbkyhotOQXlsYc-uhBZiIRqdDnRXC2GOFpZpUN09ZNUZRVTNZODZJSlJBTDA0QThDREtIRS4u',
    linkText: 'Open Form Analysis',
  },
  'Unit5-Audio-WordDoc': {
    type: 'embed',
    src: 'https://docs.google.com/document/d/e/2PACX-1vRZR3r5IoEGDi0okO7E-GHVfb9yPtadU3H8v6urWH_bvpmze1qFmm_OZL_63jmjGfiG7ML-ahpuoSPC/pub?embedded=true',
    linkText: 'Open Google Doc',
  },
  'Unit8-FigmaPP': {
    type: 'embed',
    src: 'https://embed.figma.com/deck/dXeqnHS4e9UQvtnL7JdCXw/FMP-Pitch?node-id=1-105&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&embed-host=share',
    linkText: 'Open FMP Pitch',
  },
  'Unit8-MustangBoard': {
    type: 'embed',
    src: 'https://embed.figma.com/design/HFjpFJebLUYLWtSdWE4uS5/Mustang-Board?node-id=0-1&embed-host=share',
    linkText: 'Open Mustang Board',
  },
  'Unit8-MX5Board': {
    type: 'embed',
    src: 'https://embed.figma.com/design/YVZFoUme4R85vvLtatLQCL/MX5Board?node-id=0-1&embed-host=share',
    linkText: 'Open MX5 board',
  },
  'Unit8-Bioshock': {
    type: 'embed',
    src: 'https://archive.org/embed/vghf_design_doc_archive/bioshock-pitch-document',
    linkText: 'Bioshock Pitch',
  },
  '[Insert Name Here] Ep1 FINAL': {
    type: 'audio',
    src: '/mp3/[Insert Name Here] Ep1 FINAL.mp3',
    linkText: 'Listen / Download',
  },
}

function embedHref(src: string) {
  if (src.includes('figma.com')) {
    return src.replace('embed.figma.com', 'www.figma.com').split('?')[0]
  }
  return src.replace('&embed=true', '')
}

function embedBlock(src: string, linkText: string) {
  const href = embedHref(src)
  return `<div class="figma-wrapper">
    <iframe src="${src}"></iframe>
    <a href="${href}" target="_blank" rel="noopener" class="embed-mobile-link">${linkText}</a>
  </div>`
}

function audioEmbedBlock(src: string, linkText: string) {
  return `<div class="figma-wrapper" data-ko-embed="audio">
    <audio controls preload="metadata" src="${src}" style="width: 100%;"></audio>
    <a href="${src}" target="_blank" rel="noopener" download class="embed-mobile-link">${linkText}</a>
  </div>`
}

function modelEmbedBlock(src: string, linkText: string) {
  return `<div class="figma-wrapper model-viewer-wrapper" data-ko-embed="model">
    <div class="glb-viewer" data-glb-viewer data-src="${src}">
      <canvas class="glb-viewer__canvas"></canvas>
    </div>
    <a href="${src}" target="_blank" rel="noopener" download class="embed-mobile-link">${linkText}</a>
  </div>`
}

export function stripEmbedPlaceholders(text: string) {
  let out = text
  const keys = Object.keys(EMBED_REPLACEMENTS).sort((a, b) => b.length - a.length)

  for (const key of keys) {
    if (!key.includes('[')) {
      out = out.split(`[${key}]`).join(' ')
    }
    out = out.split(key).join(' ')
  }

  return out.replace(/\[\s*\]/g, ' ')
}

export function replaceEmbeds(content: string) {
  let out = content
  for (const [key, val] of Object.entries(EMBED_REPLACEMENTS)) {
    const replacement =
      val.type === 'model'
        ? modelEmbedBlock(val.src, val.linkText)
        : val.type === 'audio'
          ? audioEmbedBlock(val.src, val.linkText)
          : embedBlock(val.src, val.linkText)
    out = out.split(key).join(replacement)
  }
  return out
}

export function embedExternalHref(src: string) {
  return embedHref(src)
}
