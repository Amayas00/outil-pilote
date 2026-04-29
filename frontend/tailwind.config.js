/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Base surfaces
        surface: {
          0:  '#09090C',  // deepest background
          1:  '#0D0E12',  // app background
          2:  '#13141A',  // cards, panels
          3:  '#1A1B22',  // elevated cards
          4:  '#21222C',  // hover states
          5:  '#2A2B36',  // borders, dividers
        },
        // Text hierarchy
        ink: {
          1: '#F1F2F5',   // primary text
          2: '#A8ABBE',   // secondary text
          3: '#5C607A',   // muted text
          4: '#3A3D52',   // disabled / placeholder
        },
        // Brand accent
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Planning motif colors (matches backend fixtures)
        motif: {
          conge:        '#22C55E',
          maladie:      '#EF4444',
          temps_partiel:'#F97316',
          mission:      '#3B82F6',
          reunion:      '#A855F7',
          gestion:      '#92400E',
          pas_affectation: '#6B7280',
          formation:    '#06B6D4',
          visite:       '#F43F5E',
          ofis:         '#64748B',
        },
      },
      borderRadius: {
        'sm':  '4px',
        DEFAULT:'6px',
        'md':  '8px',
        'lg':  '12px',
        'xl':  '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-md': '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
        'card-lg': '0 8px 32px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.3)',
        'glow':    '0 0 0 1px rgba(59,130,246,0.4), 0 0 20px rgba(59,130,246,0.15)',
        'inner':   'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'fade-in':     'fadeIn 0.2s ease-out',
        'slide-up':    'slideUp 0.25s ease-out',
        'slide-in-left':'slideInLeft 0.25s ease-out',
        'skeleton':    'skeleton 1.5s ease-in-out infinite',
        'spin-slow':   'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:      { from: { opacity: '0' },                     to: { opacity: '1' } },
        slideUp:     { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        skeleton:    { '0%, 100%': { opacity: '0.4' }, '50%': { opacity: '0.8' } },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
