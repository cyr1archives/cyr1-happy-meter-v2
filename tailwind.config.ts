import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      /* ---------------------------------------------
         Typography
      --------------------------------------------- */
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },

      /* ---------------------------------------------
         Semantic Colors (CSS Variable Driven)
      --------------------------------------------- */
      colors: {
        foreground: "rgb(var(--foreground))",

        mood: {
          red: "var(--mood-red)",
          orange: "var(--mood-orange)",
          yellow: "var(--mood-yellow)",
          green: "var(--mood-green)",
          blue: "var(--mood-blue)",
        },
      },

      /* ---------------------------------------------
         Animated Gradient Hook
         (actual animation lives in CSS)
      --------------------------------------------- */
      backgroundImage: {
        "warm-animated":
          "linear-gradient(-45deg, var(--g1), var(--g2), var(--g3), var(--g4))",
      },

      /* ---------------------------------------------
         Animation Utilities (optional helpers)
      --------------------------------------------- */
      animation: {
        "warm-pulse": "deepWarmPulse 20s ease infinite",
        "slow-pulse": "deepWarmPulse 30s ease infinite",
      },
    },
  },

  plugins: [],
};

export default config;
