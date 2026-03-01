/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        base: '#F9F6F0',
        main: '#2C302B',
        accent: '#7A8B76',
        'accent-luxury': '#BFA071',
        secondary: '#EAE6DF',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'sans-serif'],
        serif: ['"Lora"', 'serif'],
      },
    },
  },
  plugins: [],
}
