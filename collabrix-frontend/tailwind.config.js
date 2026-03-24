/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Disable preflight so Tailwind utilities don't reset existing custom CSS
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // Matches CSS variables in index.css
        brand: {
          sidebar:  '#1C3A82',
          dark:     '#152E6A',
          DEFAULT:  '#1B3A82',
          light:    '#2563EB',
          accent:   '#3B82F6',
        },
      },
    },
  },
  plugins: [],
}
