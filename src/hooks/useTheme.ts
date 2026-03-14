import { useUIStore } from '../stores/uiStore'

export const fontSerif = "'Instrument Serif', Georgia, serif"
export const fontSans  = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

const DARK = {
  bg: '#0f172a', navBg: 'rgba(15,23,42,0.95)',
  surface: 'rgba(255,255,255,0.02)', surfaceBorder: 'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(99,102,241,0.05)',
  textPrimary: '#f1f5f9', textSecondary: '#94a3b8', textMuted: '#64748b', textFaint: '#475569',
  inputBg: 'rgba(255,255,255,0.04)', inputBorder: 'rgba(255,255,255,0.08)',
  selectBg: 'rgba(15,23,42,0.9)',
}

const LIGHT = {
  bg: '#f8fafc', navBg: 'rgba(248,250,252,0.98)',
  surface: 'rgba(0,0,0,0.03)', surfaceBorder: 'rgba(0,0,0,0.09)',
  surfaceHover: 'rgba(99,102,241,0.07)',
  textPrimary: '#0f172a', textSecondary: '#475569', textMuted: '#64748b', textFaint: '#94a3b8',
  inputBg: 'rgba(0,0,0,0.04)', inputBorder: 'rgba(0,0,0,0.1)',
  selectBg: '#ffffff',
}

export type Theme = typeof DARK

export function useTheme() {
  const theme = useUIStore((s) => s.theme)
  const toggleTheme = useUIStore((s) => s.toggleTheme)
  const t = theme === 'dark' ? DARK : LIGHT
  return { theme, toggleTheme, t }
}
