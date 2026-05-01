/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        saffron: {
          400: '#FFAD33',
          500: '#FF9933',
          600: '#E6891F',
        },
        navy: {
          800: '#0F1623',
          900: '#080D14',
          950: '#050810',
        },
        glass: 'rgba(255,255,255,0.04)',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        pulse: 'pulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
