/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        hornets: {
          'primary':    '#1E3A5F',   // Deep Navy — header, primary surfaces
          'secondary':  '#E8354A',   // Punchy Red-Pink — loss, destructive actions
          'tertiary':   '#6C3FC9',   // Electric Violet — away badge, accents
          'quaternary': '#00D68F',   // Sharp Emerald — win, clean sheets
          'quinary':    '#F7F9FC',   // Cool Off-White — page background
        },
        neutral: {
          'bg':        '#F0F4F8',    // Cool light background (not stark white)
          'surface':   '#FFFFFF',    // Card surface
          'card':      '#FFFFFF',    // Card / panel background
          'elevated':  '#FFFFFF',    // Elevated / modal
          'border':    '#E2E8F2',    // Subtle card border
          'muted':     '#94A3B8',    // Muted labels (PLAYED, WON etc.)
          'secondary': '#64748B',    // Secondary text
          'fg':        '#0F172A',    // Primary text — near black with blue tint
          'accent':    '#0EA5E9',    // Sky Blue — teal replacement, CTA buttons
        },
        result: {
          'win':  '#00D68F',         // Emerald
          'loss': '#E8354A',         // Red-Pink
          'draw': '#94A3B8',         // Slate
        },
        stat: {
          'default':   '#0F172A',    // Played, Won — just strong dark
          'positive':  '#00D68F',    // Goals For, Clean Sheets/Quarters
          'negative':  '#E8354A',    // Goals Against, negative diff
          'neutral':   '#0EA5E9',    // Neutral highlight stats
        },
        badge: {
          'league-bg':    '#EEF2FF',
          'league-fg':    '#4338CA',
          'friendly-bg':  '#F0FDF4',
          'friendly-fg':  '#15803D',
          'cup-bg':       '#FFF7ED',
          'cup-fg':       '#C2410C',
          'home-bg':      '#EFF6FF',
          'home-fg':      '#1D4ED8',
          'away-bg':      '#FAF5FF',
          'away-fg':      '#7E22CE',
        },
      },
      fontFamily: {
        'sans':  ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        'mono':  ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem',    letterSpacing: '0.04em'  }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em'  }],
        'base': ['1rem',     { lineHeight: '1.5rem',  letterSpacing: '0em'     }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem', letterSpacing: '-0.015em'}],
        '2xl':  ['1.5rem',   { lineHeight: '2rem',    letterSpacing: '-0.02em' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em'}],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem',  letterSpacing: '-0.03em' }],
      },
      boxShadow: {
        'card':    '0 1px 2px rgba(15,23,42,0.04), 0 1px 6px rgba(15,23,42,0.06)',
        'card-md': '0 4px 12px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.05)',
        'card-hover': '0 8px 24px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)',
        'btn':     '0 1px 2px rgba(15,23,42,0.15)',
        'header':  '0 1px 0px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        'sm':  '6px',
        'md':  '10px',
        'lg':  '14px',
        'xl':  '18px',
        '2xl': '24px',
        'full': '9999px',
      },
    },
  },
  plugins: [],
}