/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          dark:    'var(--brand-dark)',
          light:   'var(--brand-light)',
          glow:    'rgba(var(--brand-rgb), 0.15)',
        },
        bg: {
          main:  'var(--bg-main)',
          card:  'var(--bg-card)',
          hover: 'var(--bg-hover)',
        },
        text: {
          main:    'var(--text-main)',
          muted:   'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          accent: 'var(--border-accent)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        sans: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        'soft': '2rem',
      }
    },
  },
  plugins: [],
}
