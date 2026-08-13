/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Outfit"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#07131a',
          900: '#0c1b24',
          800: '#143041',
          700: '#1f4558',
          500: '#4a6d7c',
          300: '#8a9aab',
        },
        mist: {
          50: '#f7fbfb',
          100: '#eef6f6',
          200: '#d8e8ea',
        },
        teal: {
          600: '#0f766e',
          500: '#0d9488',
          400: '#2dd4bf',
        },
        sand: {
          400: '#e7c59a',
          500: '#d4a574',
        },
      },
      boxShadow: {
        soft: '0 18px 50px rgba(12, 27, 36, 0.08)',
        lift: '0 10px 30px rgba(12, 27, 36, 0.12)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(2%, -1%, 0) scale(1.04)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        rise: 'rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        drift: 'drift 14s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
      },
    },
  },
  plugins: [],
}
