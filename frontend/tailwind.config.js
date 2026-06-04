/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium Light Theme - Enterprise SaaS Colors
        'primary': {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB', // Primary
          700: '#1D4ED8', // Primary Hover
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        'slate': {
          50: '#F8FAFC',  // Background
          100: '#F1F5F9',
          200: '#E2E8F0', // Border
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569', // Text Secondary
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A', // Text Primary
        },
        'emerald': {
          500: '#10B981', // Success
          600: '#059669',
        },
        'amber': {
          500: '#F59E0B', // Warning
          600: '#D97706',
        },
        'red': {
          500: '#EF4444', // Error
          600: '#DC2626',
        },
      },
      backgroundColor: {
        'page': '#F8FAFC',    // Light background
        'surface': '#FFFFFF',  // White surface
        'surface-hover': '#F1F5F9',
      },
      borderColor: {
        'light': '#E2E8F0',
        'lighter': '#F1F5F9',
      },
      textColor: {
        'primary': '#0F172A',      // Text Primary
        'secondary': '#475569',     // Text Secondary
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      fontFamily: {
        'montserrat': ['"Montserrat"', 'sans-serif'],
        'poppins': ['"Poppins"', 'sans-serif'],
        'inter': ['"Inter"', 'sans-serif'],
        'sans': ['"Inter"', 'sans-serif'], // Default
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        'base': '0 1px 3px 0 rgba(15, 23, 42, 0.1), 0 1px 2px 0 rgba(15, 23, 42, 0.06)',
        'md': '0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06)',
        'lg': '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
        'xl': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.04)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.12)',
        'hover': '0 4px 12px 0 rgba(15, 23, 42, 0.15)',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'base': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
      },
      opacity: {
        '5': '0.05',
        '10': '0.1',
        '20': '0.2',
      },
    },
  },
  plugins: [],
};
