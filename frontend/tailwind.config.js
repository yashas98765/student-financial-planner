/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary accent using your OKLCH color
        primary: {
          50: 'oklch(98% 0.02 27.325)', // Very light warm background
          100: 'oklch(95% 0.04 27.325)', // Light background
          200: 'oklch(90% 0.08 27.325)', // Subtle accent
          300: 'oklch(85% 0.12 27.325)', // Muted accent
          400: 'oklch(75% 0.18 27.325)', // Medium accent
          500: 'oklch(65% 0.22 27.325)', // Your original color adjusted
          600: 'oklch(57.7% 0.245 27.325)', // Your exact color
          700: 'oklch(50% 0.22 27.325)', // Darker variant
          800: 'oklch(42% 0.18 27.325)', // Much darker
          900: 'oklch(35% 0.15 27.325)', // Darkest
        },
        // Background colors optimized for financial apps
        background: {
          primary: 'oklch(98.5% 0.005 27.325)', // Main app background
          secondary: 'oklch(96% 0.01 27.325)', // Secondary background
          card: 'oklch(100% 0 0)', // Pure white for cards
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
