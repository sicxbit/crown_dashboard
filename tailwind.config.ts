import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7ff",
          100: "#e6ecff",
          200: "#c2cdff",
          300: "#9dadec",
          400: "#6f7fd7",
          500: "#4c5cc0",
          600: "#3645a5",
          700: "#2b3885",
          800: "#232f6d",
          900: "#1f295b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
