/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F8F6',
        panel: '#FFFFFF',
        panel2: '#F4F5F7',
        line: '#E6E8E4',
        ink: '#1A1A1A',
        copy: '#333333',
        muted: '#888888',
        cream: '#FCECE9',
        coral: '#E15B64',
        rose: '#D94A64',
        roseSoft: '#FFF0F2',
        amber: '#D97706',
        teal: '#0F766E',
        danger: '#E15B64',
        calm: '#5B8DB8',
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'Source Han Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        panel: '0 2px 14px rgba(28, 28, 28, 0.045)',
      },
    },
  },
  plugins: [],
}
