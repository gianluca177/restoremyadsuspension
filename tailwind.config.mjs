import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          400: '#4fb4ff',
          500: '#1389ff',
          600: '#0066dd',
        },
        mint: '#48e0c6',
        darkbg: '#06162b',
        panel: '#071c34',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Sora', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        'site': '1200px',
      },
    },
  },
  plugins: [forms],
};
