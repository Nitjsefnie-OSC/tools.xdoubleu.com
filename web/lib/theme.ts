/**
 * Per-device theme preference in localStorage, applied as `data-theme` on
 * <html>. public/theme-init.js repeats this resolution for the pre-paint run.
 */

export const THEMES = ['auto', 'light', 'dark'] as const

export type Theme = (typeof THEMES)[number]

export const THEME_KEY = 'theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function isTheme(value: string | null): value is Theme {
  return THEMES.some((theme) => theme === value)
}

export function getTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  return isTheme(stored) ? stored : 'auto'
}

/** Stores and applies a theme, ignoring anything unrecognised; returns what was applied. */
export function setTheme(value: string): Theme {
  const theme = isTheme(value) ? value : 'auto'
  localStorage.setItem(THEME_KEY, theme)
  const dark = theme === 'dark' || (theme === 'auto' && window.matchMedia(DARK_QUERY).matches)
  const el = document.documentElement
  el.dataset.theme = dark ? 'dark' : 'light'
  el.style.colorScheme = dark ? 'dark' : 'light'
  return theme
}
