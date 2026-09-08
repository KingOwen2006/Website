import { useEffect, useState } from 'react'
import { readStoredTheme, THEME_STORAGE_KEY } from '../themes/themes'
import type { ThemeId } from '../themes/types'

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (next: ThemeId) => setThemeState(next)

  return { theme, setTheme }
}
