/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background, #090d16)",
        foreground: "var(--foreground, #f8fafc)",
        card: {
          DEFAULT: "var(--card, rgba(15, 23, 42, 0.75))",
          foreground: "var(--card-foreground, #f8fafc)",
        },
        popover: {
          DEFAULT: "var(--popover, #090d16)",
          foreground: "var(--popover-foreground, #f8fafc)",
        },
        primary: {
          DEFAULT: "var(--primary, #6366f1)",
          foreground: "var(--primary-foreground, #ffffff)",
        },
        secondary: {
          DEFAULT: "var(--secondary, #1e293b)",
          foreground: "var(--secondary-foreground, #f8fafc)",
        },
        muted: {
          DEFAULT: "var(--muted, #1e293b)",
          foreground: "var(--muted-foreground, #94a3b8)",
        },
        accent: {
          DEFAULT: "var(--accent, #1e293b)",
          foreground: "var(--accent-foreground, #f8fafc)",
        },
        border: "var(--border, rgba(255, 255, 255, 0.1))",
        input: "var(--input, rgba(255, 255, 255, 0.15))",
        ring: "var(--ring, #6366f1)",
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
