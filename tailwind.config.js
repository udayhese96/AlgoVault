/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        'glass-bg': 'var(--glass-bg)',
        'glass-border': 'var(--glass-border)',
        'nav-bg': 'var(--nav-bg)',
        'input-bg': 'var(--input-bg)',
      },
      animation: {
        'dock': 'dock 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards',
      },
      keyframes: {
        dock: {
          '0%': { transform: 'scale(1) translateY(0)' },
          '100%': { transform: 'scale(1.15) translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
