// ⚠️ REFERENCIA: Este archivo se mantiene sincronizado con src/index.css.
// Los temas definidos acá deben coincidir 1:1 con las clases CSS (.theme-*).
// El selector real de temas está en src/pages/Settings.jsx (hardcodeado).
// Este archivo es documentación + referencia para programadores, no se consume en runtime.
// Última sincronización: 2026-07-05 — incluye tema obsidian-gold.

export const THEME_CONFIG = {
  pastel: {
    id: 'pastel',
    name: 'Rosa Pastel',
    description: 'Identidad principal · Suave y amigable',
    brand: '#F9A8C9',  brandRgb: '249, 168, 201',
    bg: '#FDF2F8',     card: '#FFFFFF',
    text: '#1C0A14',   muted: '#6B3A54',
    border: 'rgba(249, 168, 201, 0.25)',
    shadow: 'rgba(249, 168, 201, 0.15)',
  },
  mint: {
    id: 'mint',
    name: 'Menta Fresca',
    description: 'Verde bosque · Relajante',
    brand: '#34D399',  brandRgb: '52, 211, 153',
    bg: '#ECFDF5',     card: '#FFFFFF',
    text: '#022C22',   muted: '#065F46',
    border: 'rgba(52, 211, 153, 0.20)',
    shadow: 'rgba(52, 211, 153, 0.15)',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavanda Mística',
    description: 'Índigo · Elegante',
    brand: '#A78BFA',  brandRgb: '167, 139, 250',
    bg: '#F5F3FF',     card: '#FFFFFF',
    text: '#1E1033',   muted: '#4C1D95',
    border: 'rgba(167, 139, 250, 0.20)',
    shadow: 'rgba(167, 139, 250, 0.15)',
  },
  peach: {
    id: 'peach',
    name: 'Durazno Cálido',
    description: 'Ámbar · Acogedor',
    brand: '#FB923C',  brandRgb: '251, 146, 60',
    bg: '#FFF7ED',     card: '#FFFFFF',
    text: '#1C0A00',   muted: '#7C2D12',
    border: 'rgba(251, 146, 60, 0.20)',
    shadow: 'rgba(251, 146, 60, 0.15)',
  },
  sky: {
    id: 'sky',
    name: 'Océano Profundo',
    description: 'Azul cielo · Tranquilo',
    brand: '#38BDF8',  brandRgb: '56, 189, 248',
    bg: '#F0F9FF',     card: '#FFFFFF',
    text: '#082035',   muted: '#0C4A6E',
    border: 'rgba(56, 189, 248, 0.20)',
    shadow: 'rgba(56, 189, 248, 0.15)',
  },
  'obsidian-gold': {
    id: 'obsidian-gold',
    name: 'Obsidian Gold',
    description: 'Oro premium sobre obsidiana · Lujo',
    brand: '#D4AF37',  brandRgb: '212, 175, 55',
    bg: '#FAF7EF',     card: '#FFFFFF',
    text: '#1C1707',   muted: '#6B5A2A',
    border: 'rgba(212, 175, 55, 0.20)',
    shadow: 'rgba(212, 175, 55, 0.15)',
  },
}

export const FONT_CONFIG = {
  syne_dm: {
    id: 'syne_dm', name: 'Syne + Outfit',
    displayFamily: '"Syne", sans-serif',
    bodyFamily: '"Outfit", sans-serif',
    desc: 'Default · Moderno y limpio',
  },
  quicksand: {
    id: 'quicksand', name: 'Quicksand',
    displayFamily: '"Quicksand", sans-serif',
    bodyFamily: '"Quicksand", sans-serif',
    desc: 'Amigable · Redondeado',
  },
}
