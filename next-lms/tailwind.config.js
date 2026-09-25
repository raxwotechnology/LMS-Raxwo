/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#050042',
          navyHover: '#120d63',
          soft: '#f3f4fb',
          border: '#d9dbee',
          text: '#0d0b2e',
          muted: '#5c5e80',
          focus: '#5b55d6',
          error: '#c22b3a',
          success: '#1b7a4b',
          warning: '#b7791f',
          badgeRed: '#e5484d',
          // Dark mode color tokens
          darkBg: '#0b0a24',
          darkSoft: '#16153a',
          darkBorder: '#2c2b5c',
          darkText: '#eeeefb',
          darkButton: '#4a43d1',
        },
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
      screens: {
        'split': '860px',
        'xs': '420px',
      },
    },
  },
  plugins: [],
};
