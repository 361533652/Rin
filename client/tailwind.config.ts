/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector','[data-color-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        'theme': 'var(--primary)',
        'theme-hover': 'var(--primary-hover)',
        'theme-active': 'var(--primary-active)',
        'theme-light': 'var(--primary-light)',
        'mist': 'var(--accent)',
        'mist-light': 'var(--accent-light)',
        'mist-text': 'var(--accent-text)',
        'paper': 'var(--bg-page)',
        'paper-card': 'var(--bg-card)',
        'paper-border': 'var(--border)',
        'paper-code': 'var(--bg-code)',
        'copper': {
          DEFAULT: '#b87d4a',
          hover: '#9e6b3c',
          active: '#845831',
        },
        'ink': {
          DEFAULT: '#292724',
          body: '#3C3A37',
          muted: '#8B877F',
          faint: '#AAA39A',
        },
        'background': {
          'light': '#f5f5f5',
          'dark': '#1c1c1e',
        },
        'dark': "#333333",
      },
      transitionProperty: {
        'height': 'height',
        'width': 'width',
        'spacing': 'margin, padding',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

