import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf6",
          100: "#d1fae9",
          200: "#a7f3d6",
          500: "#10a37f",
          600: "#0b8a6b",
          700: "#0a6f57",
          800: "#0b5847",
          900: "#0a483b",
        },
        ink: {
          DEFAULT: "#0f172a",
          soft: "#334155",
          muted: "#64748b",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.08)",
      },
    },
  },
  plugins: [],
};
export default config;
