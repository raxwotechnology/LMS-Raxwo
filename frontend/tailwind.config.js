/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0369A1',
          navyHover: '#075985',
          accent: '#38BDF8',
          sidebarInactive: '#D6EFFB',
          bannerChipBg: '#D6EFFB',
          bannerChipText: '#0369A1',
          bannerLabel: '#EAF7FD',
          soft: '#f3f4fb',
          border: '#d9dbee',
          text: '#0d0b2e',
          muted: '#5c5e80',
          focus: '#38BDF8',
          error: '#c22b3a',
          success: '#1b7a4b',
          warning: '#b7791f',
          badgeRed: '#e5484d',
          // Dark mode tokens
          darkBg: '#0b0a24',
          darkSoft: '#16153a',
          darkBorder: '#2c2b5c',
          darkText: '#eeeefb',
          darkButton: '#4a43d1',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      screens: {
        split: '860px',
        xs: '420px',
      },
    },
  },
  plugins: [],
};
