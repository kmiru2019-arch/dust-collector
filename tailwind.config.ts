import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      colors: {
        // 집진설비 브랜드 (산업용 — 차분한 청록 + 안전 황색)
        brand: {
          50:  '#f0f9fa',
          100: '#d9eff2',
          500: '#0e7c8c',
          600: '#0a6373',
          700: '#08505d',
          900: '#06343d',
        },
        safety: {
          DEFAULT: '#f59e0b',
          dark: '#b45309',
        },
      },
    },
  },
  plugins: [],
};

export default config;
