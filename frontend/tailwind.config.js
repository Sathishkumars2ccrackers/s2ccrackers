/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        festival: {
          dark: '#0d0814',
          card: '#171024',
          cardHover: '#221836',
          border: '#372254',
          gold: '#f59e0b',
          goldLight: '#fde047',
          goldDark: '#b45309',
          red: '#dc2626',
          redDark: '#991b1b',
          orange: '#ea580c',
          orangeLight: '#fb923c',
          green: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite linear',
        'pulse-slow': 'pulse 3s infinite ease-in-out',
        'float': 'float 4s ease-in-out infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(245, 158, 11, 0.35)',
        'red-glow': '0 0 25px -5px rgba(220, 38, 38, 0.35)',
        'card-glow': '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 15px -2px rgba(245, 158, 11, 0.15)',
      },
    },
  },
  plugins: [],
};
