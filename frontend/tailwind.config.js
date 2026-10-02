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
        app: {
          bg: '#292929',
          panel: '#1f1f1f',
          input: '#171717',
          hover: '#333333',
          selected: '#1a2b42',
          border: '#3a3a3a',
          'border-muted': '#303030',
          divider: '#3a3a3a',
        },
        pure: {
          black: '#292929',
          panel: '#1f1f1f',
          input: '#171717',
          hover: '#333333',
          selected: '#1a2b42',
          border: '#3a3a3a',
          'border-muted': '#303030',
          divider: '#3a3a3a',
        },
        accent: {
          blue: '#0066FF',
          'blue-hover': '#0052CC',
          green: '#00FF88',
          amber: '#FFB800',
          red: '#FF3366',
        },
        tx: {
          heading: '#D6D6D6',
          primary: '#D6D6D6',
          secondary: '#A8A8A8',
          muted: '#7A7A7A',
        },
      },
      borderRadius: {
        card: '10px',
        btn: '8px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Consolas', 'monospace'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        h1: ['24px', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
        h2: ['18px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }],
        h3: ['15px', { lineHeight: '1.45', letterSpacing: '0', fontWeight: '600' }],
        body: ['14px', { lineHeight: '1.55', letterSpacing: '0', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        label: ['12px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '500' }],
        overline: ['11px', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '600' }],
        micro: ['10px', { lineHeight: '1.2', letterSpacing: '0.06em', fontWeight: '600' }],
        'mono-sm': ['12px', { lineHeight: '1.4', letterSpacing: '0' }],
        'mono-md': ['13px', { lineHeight: '1.45', letterSpacing: '0' }],
      },
    },
  },
  plugins: [],
};
