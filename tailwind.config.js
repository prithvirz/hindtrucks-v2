/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Single source of truth for the brand accent — change here to re-theme.
        accent: {
          DEFAULT: '#F26A1B',
          soft: '#FFF3EA',
          press: '#D9590F',
          ring: 'rgba(242,106,27,0.22)',
        },
        // Cool secondary accent for info / map / links.
        info: {
          DEFAULT: '#2563EB',
          soft: '#EAF1FE',
        },
        ink: {
          DEFAULT: '#0B0B0F',
          muted: '#6B7280',
          faint: '#9CA3AF',
        },
        // Dark "obsidian" surfaces — tokenized so premium cards stay consistent.
        night: {
          900: '#0B0B0F',
          800: '#15151E',
          700: '#1E1E2A',
          600: '#2A2937',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          grey: '#F6F7F9',
          sunken: '#EEF0F3',
        },
        canvas: '#EAECF0',
        hairline: '#ECEEF1',
        success: {
          DEFAULT: '#16A34A',
          soft: '#E8F5EC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Gurmukhi', 'system-ui', 'sans-serif'],
      },
      // Two-radius system: controls (sm) and cards (lg).
      borderRadius: {
        lg: '14px',
        xl: '14px',
        '2xl': '20px',
        '3xl': '26px',
      },
      boxShadow: {
        // Soft, layered elevation — the premium depth language.
        xs: '0 1px 2px rgba(11,11,15,0.05)',
        card: '0 1px 2px rgba(11,11,15,0.04), 0 8px 24px rgba(11,11,15,0.06)',
        pop: '0 12px 40px rgba(11,11,15,0.12)',
        accent: '0 8px 24px rgba(242,106,27,0.28)',
        glow: '0 0 0 4px rgba(242,106,27,0.16)',
      },
      maxWidth: {
        app: '420px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease both',
        'scale-in': 'scale-in 0.25s ease both',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.3s ease both',
        shimmer: 'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
}
