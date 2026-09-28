import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          950: "var(--studio-950)",
          900: "var(--studio-900)",
          850: "var(--studio-850)",
          800: "var(--studio-800)",
          750: "var(--studio-750)",
          700: "var(--studio-700)",
          600: "var(--studio-600)",
          500: "var(--studio-500)",
          400: "var(--studio-400)",
          300: "var(--studio-300)",
          200: "var(--studio-200)",
          100: "var(--studio-100)",
          50: "var(--studio-50)",
          border: "var(--studio-border)",
          card: "var(--studio-card)",
          text: "var(--studio-text)",
          textmuted: "var(--studio-text-muted)",
        },
        accent: {
          blue: "#3b82f6",
          cyan: "#06b6d4",
          violet: "#8b5cf6",
          purple: "#a855f7",
          amber: "#f59e0b",
          emerald: "#10b981",
          rose: "#f43f5e",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
