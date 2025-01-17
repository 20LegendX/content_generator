module.exports = {
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
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}