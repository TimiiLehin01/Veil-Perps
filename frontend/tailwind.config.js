/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#08090A',
        surface: '#0E1012',
        panel: '#13161A',
        border: '#1E2328',
        muted: '#2A2F36',
        subtle: '#3D444D',
        dim: '#6B7280',
        ghost: '#9CA3AF',
        ivory: '#E8E6E1',
        emerald: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        crimson: {
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        gold: {
          400: '#FBBF24',
          500: '#F59E0B',
        },
        arcium: {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        }
      },
      fontFamily: {
        display: ["'Syne'", 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
        body: ["'DM Sans'", 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          from: { boxShadow: '0 0 4px #8B5CF6' },
          to: { boxShadow: '0 0 16px #8B5CF6, 0 0 32px #8B5CF640' },
        }
      },
    },
  },
  plugins: [],
}
