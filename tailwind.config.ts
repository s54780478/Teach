import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        /**
         * 接近 Apple 官網、可合法嵌入／跨平台：
         * - Apple／iOS：系統 -apple-system（含 SF／蘋方）
         * - 其他：Inter（拉丁）+ Noto Sans TC（繁中，OFL）
         * 不可嵌入 SF Pro／PingFang 字型檔。
         */
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'var(--font-inter)',
          'var(--font-noto-sans-tc)',
          '"Segoe UI"',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
        ],
      },
      colors: {
        brand: {
          50: '#fff5f5',
          100: '#fed7d7',
          200: '#feb2b2',
          300: '#fc8181',
          400: '#f56565',
          500: '#FF6363', // Superprof coral（量測自 superprof.com）
          600: '#ff5252',
          700: '#c53030',
          800: '#9b2c2c',
          900: '#742a2a',
        },
      },
    },
  },
  plugins: [],
};
export default config;
