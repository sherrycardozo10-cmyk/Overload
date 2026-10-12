/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sage: { DEFAULT: '#5E7A5E', dark: '#3D5A3D', light: '#DCE5DA', mist: '#EDF1EA' },
        cream: '#FAF8F4',
        sand: { DEFAULT: '#F5F0E8', dark: '#E8E0D2' },
        charcoal: '#2A2A2A',
        warn: '#C99A4B',
        over: '#B5645A',
      },
      fontFamily: {
        sans: ['Satoshi', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        tabIn: { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'none' } },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        sheetUp: { '0%': { transform: 'translateY(40px)', opacity: 0 }, '100%': { transform: 'none', opacity: 1 } },
        pop: { '0%': { transform: 'scale(.8)' }, '55%': { transform: 'scale(1.18)' }, '100%': { transform: 'scale(1)' } },
        draw: { '0%': { strokeDashoffset: 24 }, '100%': { strokeDashoffset: 0 } },
        toastIn: { '0%': { opacity: 0, transform: 'translateY(-10px)' }, '100%': { opacity: 1, transform: 'none' } },
        breathe: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.55 } },
      },
      animation: {
        tab: 'tabIn .28s ease-out',
        fade: 'fadeIn .2s ease-out',
        sheet: 'sheetUp .3s cubic-bezier(.2,.8,.2,1)',
        pop: 'pop .35s ease-out',
        draw: 'draw .3s ease-out forwards',
        toast: 'toastIn .25s ease-out',
        breathe: 'breathe 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
