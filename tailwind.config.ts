import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nuit: {
          DEFAULT: "#0B1220",
          soft: "#121B2E",
          light: "#1C2B45",
        },
        ivoire: "#F6F1E7",
        champagne: {
          DEFAULT: "#B8965A",
          light: "#D7BE8C",
          dark: "#8F7140",
        },
        terre: {
          DEFAULT: "#A65B2E",
          light: "#C97B47",
          dark: "#7C4220",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        prose: "68ch",
      },
      boxShadow: {
        soft: "0 20px 60px -20px rgba(11, 18, 32, 0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
