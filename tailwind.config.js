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
          'primary': '#61707D',      // Blue Slate
          'secondary': '#E85D75',    // Bubblegum Pink
          'tertiary': '#9D69A3',     // Vintage Lavender
          'quaternary': '#40F99B',   // Spring Green
          'quinary': '#F5FBEF',      // Ivory
        },
        neutral: {
          'bg': '#ffffff',           // White
          'fg': '#111827',           // Dark Navy
          'accent': '#06b6d4',       // Teal
          'card': '#f8fafc',         // Off-white
          'secondary': '#e2e8f0',    // Light gray
          'muted': '#64748b',        // Medium gray
          'border': '#cbd5e1',       // Light gray border
        },
        result: {
          'win': '#10b981',          // Vivid Emerald Green
          'loss': '#ef4444',         // Vivid Red
          'draw': '#6b7280',         // Vivid Grey
        }
      },
      fontFamily: {
        'serif': ['Inter', 'sans-serif'],
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
