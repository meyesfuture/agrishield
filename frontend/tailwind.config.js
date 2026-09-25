/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        primary: '#FFFFFF',
        secondary: '#A1A1AA',
        accent: '#2457FF',
        accentLight: '#2457FF20',
        border: '#27272A',
        muted: '#1A1A1A',
        critical: '#FF3B30'
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'IBM Plex Sans', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': 'radial-gradient(circle, #27272A 1px, transparent 1px)',
      }
    },
  },
  plugins: [],
}
