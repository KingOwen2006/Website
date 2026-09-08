import {black, blue, cyan, gray, green, magenta, orange, purple, red, white, yellow} from '@sanity/color'
import {buildTheme, type ThemeFontSize} from '@sanity/ui/theme'

const ONE_UI_SANS =
  '"One UI Sans", "Samsung One", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

const ONE_UI_MONO =
  'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace'

const fontSizes: ThemeFontSize[] = [
  {ascenderHeight: 4, descenderHeight: 4, fontSize: 10, iconSize: 17, lineHeight: 15, letterSpacing: 0},
  {ascenderHeight: 5, descenderHeight: 5, fontSize: 13, iconSize: 21, lineHeight: 19, letterSpacing: 0},
  {ascenderHeight: 6, descenderHeight: 6, fontSize: 16, iconSize: 25, lineHeight: 23, letterSpacing: 0},
  {ascenderHeight: 7, descenderHeight: 7, fontSize: 19, iconSize: 29, lineHeight: 27, letterSpacing: 0},
  {ascenderHeight: 8, descenderHeight: 8, fontSize: 22, iconSize: 33, lineHeight: 31, letterSpacing: 0},
]

const headingSizes: ThemeFontSize[] = [
  {ascenderHeight: 5, descenderHeight: 5, fontSize: 13, iconSize: 17, lineHeight: 19, letterSpacing: 0},
  {ascenderHeight: 6, descenderHeight: 6, fontSize: 16, iconSize: 25, lineHeight: 23, letterSpacing: 0},
  {ascenderHeight: 7, descenderHeight: 7, fontSize: 21, iconSize: 33, lineHeight: 29, letterSpacing: 0},
  {ascenderHeight: 8, descenderHeight: 8, fontSize: 27, iconSize: 41, lineHeight: 35, letterSpacing: 0},
  {ascenderHeight: 9, descenderHeight: 9, fontSize: 33, iconSize: 49, lineHeight: 41, letterSpacing: 0},
]

export const oneUiTheme = buildTheme({
  palette: {
    black,
    white,
    blue: {
      ...blue,
      400: {hex: '#3b82f6', title: 'Blue 400'},
      500: {hex: '#2563eb', title: 'Blue 500'},
      600: {hex: '#1d4ed8', title: 'Blue 600'},
    },
    gray: {
      ...gray,
      50: {hex: '#f8f9fb', title: 'Gray 50'},
      100: {hex: '#ececee', title: 'Gray 100'},
      200: {hex: '#dfe1e6', title: 'Gray 200'},
      300: {hex: '#d5d7dc', title: 'Gray 300'},
      500: {hex: '#6b7280', title: 'Gray 500'},
      900: {hex: '#1a1a1a', title: 'Gray 900'},
    },
    red,
    orange,
    yellow,
    green,
    cyan,
    purple,
    magenta,
  },
  font: {
    code: {
      family: ONE_UI_MONO,
      weights: {regular: 400, medium: 500, semibold: 600, bold: 700},
      sizes: fontSizes,
    },
    heading: {
      family: ONE_UI_SANS,
      weights: {regular: 700, medium: 800, semibold: 900, bold: 900},
      sizes: headingSizes,
    },
    label: {
      family: ONE_UI_SANS,
      weights: {regular: 500, medium: 600, semibold: 700, bold: 800},
      sizes: fontSizes,
    },
    text: {
      family: ONE_UI_SANS,
      weights: {regular: 400, medium: 500, semibold: 600, bold: 700},
      sizes: fontSizes,
    },
  },
  radius: [0, 6, 10, 14, 18, 22, 28],
  space: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96],
  button: {
    border: {width: 0},
    focusRing: {offset: 0, width: 2},
    textWeight: 'semibold',
  },
  card: {
    border: {width: 1},
    focusRing: {offset: 0, width: 2},
    shadow: {outline: 0},
  },
  input: {
    border: {width: 1},
    checkbox: {
      size: 18,
      focusRing: {offset: 0, width: 2},
    },
    radio: {
      size: 18,
      markSize: 10,
      focusRing: {offset: 0, width: 2},
    },
    switch: {
      width: 42,
      height: 24,
      padding: 3,
      transitionDurationMs: 180,
      transitionTimingFunction: 'ease-out',
      focusRing: {offset: 0, width: 2},
    },
    select: {
      focusRing: {offset: 0, width: 2},
    },
    text: {
      focusRing: {offset: 0, width: 2},
    },
  },
  color: {
    selectable: {
      primary: {_hue: 'blue'},
    },
  },
})
