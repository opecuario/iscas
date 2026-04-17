import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#00401c",
          50: "#e6f0ea",
          100: "#c4ddcd",
          200: "#9ec6ac",
          300: "#76ae89",
          400: "#4e9967",
          500: "#2c8449",
          600: "#1a6b39",
          700: "#0f532b",
          800: "#063d1f",
          900: "#00401c",
        },
        terra: "#a97a4a",
        sand: "#f7f3ec",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
