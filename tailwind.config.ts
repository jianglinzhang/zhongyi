import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // 中医玉石绿 - 护眼配色
        zhongyi: {
          50:  '#f0f7f2',
          100: '#dceee2',
          200: '#bbddc7',
          300: '#8ec5a3',
          400: '#5fa97c',
          500: '#3f8e61',
          600: '#2f724d',
          700: '#275c40',
          800: '#224a35',
          900: '#1d3d2d',
          950: '#0f2219',
        },
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(1rem)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
