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
          'primary': '#6B5B4F',      // Warm taupe/brown
          'secondary': '#A67C52',    // Warm clay/terracotta
          'tertiary': '#D97757',     // Rust/burnt orange
          'quaternary': '#C9896C',   // Warm rose
          'quinary': '#E8C5A1',      // Warm sand/cream
        },
        neutral: {
          'bg': '#f5f4ed',           // Warm cream background
          'fg': '#141413',           // Dark charcoal text
          'accent': '#c96442',       // Terracotta accent
          'card': '#faf9f5',         // Off-white surfaces
          'secondary': '#e8e6dc',    // Subtle backgrounds
          'muted': '#87867f',        // Disabled/secondary text
          'border': '#e8e6dc',       // Light borders
        }
      },
      fontFamily: {
        'serif': ['Georgia', 'serif'],
        'sans': ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
