/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EDE6D6',
        paperDark: '#E1D8C4',
        ink: '#1B1710',
        burgundy: {
          DEFAULT: '#7A1F2B',
          dark: '#5C1620',
          light: '#9A2E3C',
        },
        mustard: {
          DEFAULT: '#C9982B',
          dark: '#A87A1E',
        },
        petrol: {
          DEFAULT: '#2F4858',
          dark: '#22333F',
        },
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
