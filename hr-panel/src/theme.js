export const themes = {
  sage: {
    name: 'Sage (Default)',
    sand: '#F3EFE7',
    paper: '#FBFAF6',
    ink: '#232019',
    'ink-soft': '#6F6857',
    line: '#E4DECF',
    sage: '#5B6B4E',
    'sage-soft': '#E8EDE1',
    clay: '#B5603A',
    'clay-soft': '#F4E4DA',
    gold: '#C08A2E',
    'gold-soft': '#F6EAD0',
    danger: '#9E3B2E',
    'danger-soft': '#F3DDD8',
    radius: '12px',
    'radius-sm': '8px',
  },

  /* ── Ocean ──────────────────────────────────────────────*/
  ocean: {
    name: 'Ocean',
    sand: '#EFF4F8',
    paper: '#F8FAFC',
    ink: '#0F172A',
    'ink-soft': '#475569',
    line: '#CBD5E1',
    sage: '#1E6F9F',
    'sage-soft': '#DBEAFE',
    clay: '#D97706',
    'clay-soft': '#FEF3C7',
    gold: '#A16207',
    'gold-soft': '#FEF9C3',
    danger: '#DC2626',
    'danger-soft': '#FEE2E2',
    radius: '12px',
    'radius-sm': '8px',
  },


  /* ── Midnight ────────────────────────────────────────────
  midnight: {
    name: 'Midnight',
    sand: '#1E1E2E',
    paper: '#2A2A3C',
    ink: '#E4E4E7',
    'ink-soft': '#A1A1AA',
    line: '#3F3F50',
    sage: '#7C3AED',
    'sage-soft': '#EDE9FE',
    clay: '#F59E0B',
    'clay-soft': '#FEF3C7',
    gold: '#F59E0B',
    'gold-soft': '#FEF3C7',
    danger: '#EF4444',
    'danger-soft': '#FEE2E2',
    radius: '12px',
    'radius-sm': '8px',
  },
  */

  /* ── Forest ──────────────────────────────────────────────*/
  forest: {
    name: 'Forest',
    sand: '#F0F7F0',
    paper: '#F6FBF6',
    ink: '#1A2E1A',
    'ink-soft': '#4A6B4A',
    line: '#C8DCC8',
    sage: '#2D6A2D',
    'sage-soft': '#D4EDD4',
    clay: '#8B5C2E',
    'clay-soft': '#F0E4D4',
    gold: '#B8860B',
    'gold-soft': '#FFF8DC',
    danger: '#8B2E2E',
    'danger-soft': '#F0D4D4',
    radius: '12px',
    'radius-sm': '8px',
  },
};

export function applyTheme(theme) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme)) {
    if (key === 'name') continue;
    root.style.setProperty(`--${key}`, value);
  }
}
