/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0d9488',   // teal-600
        secondary: '#14b8a6', // teal-500
        accent: '#0891b2',    // cyan-600
        danger: '#ef4444',    // red-500
      },
    }
  },
  plugins: [],
}
