/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Single source of truth for the brand accent — change here to re-theme.
        accent: {
          DEFAULT: '#F26A1B',
          soft: 'var(--color-accent-soft)',
          press: '#D9590F',
          ring: 'rgba(242,106,27,0.22)',
        },
        // Cool secondary accent for info / map / links.
        info: {
          DEFAULT: '#2563EB',
          soft: 'var(--color-info-soft)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          muted: 'var(--color-ink-muted)',
          faint: 'var(--color-ink-faint)',
        },
        // Dark "obsidian" surfaces — tokenized so premium cards stay consistent.
        night: {
          900: '#08090C',
          800: '#0C0E14',
          700: '#151821',
          600: '#1B1E2B',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          grey: 'var(--color-surface-grey)',
          sunken: 'var(--color-surface-sunken)',
        },
        canvas: 'var(--color-canvas)',
        hairline: 'var(--color-hairline)',
        success: {
          DEFAULT: 'var(--color-success)',
          soft: 'var(--color-success-soft)',
        },
        overlay: 'var(--color-overlay)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Gurmukhi', 'system-ui', 'sans-serif'],
      },
      // Two-radius system: controls (sm) and cards (lg).
      borderRadius: {
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        // Soft, layered elevation — the premium depth language.
        xs: '0 1px 2px rgba(15,23,42,0.06)',
        card: '0 8px 24px rgba(15,23,42,0.08)',
        pop: '0 22px 54px rgba(15,23,42,0.18)',
        accent: '0 8px 22px rgba(242,106,27,0.16)',
        glow: '0 0 14px rgba(242,106,27,0.12)',
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
