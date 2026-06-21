/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cinema-bg':     '#07080F',
        'cinema-surface':'#0F1220',
        'cinema-hover':  '#192034',
        'cinema-border': '#1E2840',
        'cinema-text':   '#E8DAC0',
        'cinema-muted':  '#8085A0',
        'cinema-ember':  '#E8430A',
        'cinema-amber':  '#F5A623',
        'cinema-blue':   '#5B6AE8',
        // legacy aliases kept for any bg-surface / bg-surface-hover references
        surface: '#0F1220',
        'surface-hover': '#192034',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['"DM Mono"', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
