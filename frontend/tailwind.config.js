/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gpt: {
          sidebar: '#171717',
          main: '#212121',
          hover: '#2a2a2a',
          bubble: '#2f2f2f',
          input: '#2f2f2f',
          border: '#3c3c3c',
          green: '#10a37f',
          greenHover: '#0e8e6e'
        }
      }
    },
  },
  plugins: [],
}
