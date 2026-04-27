/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta de v1 — no modificar sin aprobación
        egeo: {
          DEFAULT: '#1e6fb5',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#1e6fb5',
          600: '#1a5f9c',
          700: '#154e82',
        },
        coral: {
          DEFAULT: '#e8785a',
          light: '#f0a08c',
          dark: '#c85d42',
        },
        arena: {
          DEFAULT: '#c9a96e',
          light: '#e8d5b0',
          dark: '#a07840',
        },
        crema: '#faf8f5', // blanco roto — fondo principal
        // Modo warning (rojo neón / negro / amarillo)
        warning: {
          red: '#ff0040',
          yellow: '#ffd700',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        // Stripes diagonales para modo warning
        'warning-stripes':
          'repeating-linear-gradient(45deg, #ffd700 0px, #ffd700 10px, #000 10px, #000 20px)',
      },
    },
  },
  plugins: [],
}
