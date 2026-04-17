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
          'primary': '#2A3151',
          'secondary': '#4D755D',
          'tertiary': '#864343',
          'quaternary': '#B25484',
          'quinary': '#DAAF56',
        },
      },
    },
  },
  plugins: [],
}
