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
        'theme': '#D88A9A',
        'theme-hover': '#C76B80',
        'theme-active': '#B45870',
        'theme-light': '#F5DDE3',
        'mist': '#8FA9C7',
        'mist-light': '#F2F6FA',
        'mist-text': '#56708F',
        'paper': '#F7F3EA',
        'paper-card': '#FFFDF8',
        'paper-border': '#E8DDE0',
        'paper-code': '#F8F6F2',
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

