/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // FeesUp brand palette
        brand: {
          bg: '#111111',
          surface: '#1A1A1A',
          border: '#2A2A2A',
          accent: '#00D97E',
          accentDark: '#00B368',
        },
        status: {
          paid: '#00D97E',
          overdue: '#F0453A',
          pending: '#F5B83D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
