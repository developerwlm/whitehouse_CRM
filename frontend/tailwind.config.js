/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0f1d',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
        },
        brand: {
          blue: '#1e40af',
          lightBlue: '#0284c7',
          teal: '#0d9488',
          accent: '#38bdf8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
