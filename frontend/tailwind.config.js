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
        pure: {
          black: '#000000',
          panel: '#0a0a0a',
          input: '#111111',
          hover: '#1a1a1a',
          selected: '#0d1117',
          border: '#2a2a2a',
          'border-muted': '#1a1a1a',
          divider: '#333333',
        },
        accent: {
          blue: '#0066FF',
          'blue-hover': '#0052CC',
          green: '#00FF88',
          amber: '#FFB800',
          red: '#FF3366',
        },
        tx: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          muted: '#666666',
        },
      },
      borderRadius: {
        card: '10px',
        btn: '8px',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
