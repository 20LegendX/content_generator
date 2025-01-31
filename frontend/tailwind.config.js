module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    'block',
    'hidden',
    'rotate-180',
    'bg-gray-50',
    'bg-gray-100',
    'bg-white',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          500: '#2196f3',
          600: '#1976d2',
          700: '#1565c0',
        },
        secondary: {
          500: '#ff4081',
          600: '#f50057',
          700: '#c51162',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}