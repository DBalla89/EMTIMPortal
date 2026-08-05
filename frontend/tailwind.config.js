/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Grigi neutri per sfondi e testo — portale professionale e pulito
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8F9FA',
          border: '#E5E7EB',
        },
        ink: {
          DEFAULT: '#111827', // testo principale
          muted: '#6B7280',   // testo secondario
        },
        // Accento brand: arancione vibrante — CTA, badge attivi, azioni primarie
        brand: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        card: '0.75rem',
      },
      boxShadow: {
        card:    '0 1px 2px 0 rgba(17,24,39,0.05), 0 1px 3px 0 rgba(17,24,39,0.06)',
        'card-hover': '0 4px 12px 0 rgba(17,24,39,0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
