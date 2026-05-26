/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5865F2',
          hover: '#4752C4',
          50: '#EEF0FF',
          100: '#D7D9FD',
          200: '#B0B4FA',
          300: '#898EF7',
          400: '#7C83F4',
          500: '#5865F2',
          600: '#4752C4',
          700: '#3D4496',
          800: '#343768',
          900: '#2A2B4A',
        },
        success: '#23A55A',
        warning: '#F0B232',
        danger: '#F23F43',
        dark: {
          bg: '#1E1F22',
          surface: '#2B2D31',
          surface2: '#313338',
          border: '#313338',
          hover: '#393A40',
          active: '#404249',
          text: '#F2F3F5',
          textSecondary: '#B5BAC1',
          textMuted: '#6D6F78',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'slide-down': 'slideDown 200ms ease-out',
        'slide-left': 'slideLeft 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-right': 'slideRight 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 200ms ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-in': 'bounceIn 300ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(88, 101, 242, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(88, 101, 242, 0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
