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
        surf: {
          0: '#0A0A0B',
          1: '#121214',
          2: '#17171A',
          3: '#1E1E22',
          4: '#232327',
        },
        edge: {
          card: '#2A2A2F',
          input: '#3F3F46',
        },
        signal: {
          blue: '#2F6FAD',
          hover: '#3579BD',
          bright: '#58A6FF',
          tint: 'rgba(88, 166, 255, 0.10)',
        },
        tx: {
          primary: '#ECECEC',
          secondary: '#A1A1AA',
          muted: '#71717A',
          onblue: '#D9E6F2',
        },
        status: {
          success: '#3FB950',
          warn: '#D29922',
          danger: '#F85149',
        },
      },
      borderRadius: {
        card: '10px',
        btn: '6px',
        pill: '999px',
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
        overline: ['11px', { lineHeight: '1.3', letterSpacing: '0.06em', fontWeight: '600' }],
        micro: ['10px', { lineHeight: '1.2', letterSpacing: '0.06em', fontWeight: '600' }],
        'mono-sm': ['12px', { lineHeight: '1.4', letterSpacing: '0' }],
        'mono-md': ['13px', { lineHeight: '1.45', letterSpacing: '0' }],
      },
    },
  },
  plugins: [],
};
