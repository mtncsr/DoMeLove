/** @type {import('tailwindcss').Config} */
export default {
  // Enable class-based dark mode and allow the existing `.theme-dark` hook
  darkMode: ['class', '.theme-dark'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}






