import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", lg: "2rem" },
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        // Primary brand — confident blue (trust + professionalism)
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#bcd3ff",
          300: "#8eb6ff",
          400: "#598dff",
          500: "#3366ff",
          600: "#1f47e6",
          700: "#1a39c4",
          800: "#1b329e",
          900: "#1c2f7d",
          950: "#141d4d",
        },
        // Accent — warm amber (finishing / craftsmanship, CTA highlights)
        accent: {
          50: "#fff8eb",
          100: "#ffedc6",
          200: "#ffd988",
          300: "#ffc14a",
          400: "#ffab20",
          500: "#f98a07",
          600: "#dd6502",
          700: "#b74506",
          800: "#94350c",
          900: "#7a2d0d",
        },
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 4px 16px rgba(16,24,40,.06)",
        "card-hover": "0 10px 30px rgba(28,47,125,.14)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up .5s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
