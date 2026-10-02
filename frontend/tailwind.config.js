/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0d0f12',
        surface: {
          DEFAULT: '#13161c',
          raised: '#181c24',
          overlay: '#1e232d',
          subtle: '#101318',
        },
        border: {
          DEFAULT: '#222733',
          muted: '#1b1f29',
          active: '#3b82f6',
        },
        console: {
          bg: '#0a0c0f',
          sidebar: '#0e1116',
          panel: '#13161c',
          border: '#1f242e',
          hover: '#191d26',
          selected: '#1e3a8a',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
