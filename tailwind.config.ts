import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'sandy-brown': 'var(--sandy-brown)',
        'honey-bronze': 'var(--honey-bronze)',
        'tuscan-sun': 'var(--tuscan-sun)',
        'golden-pollen': 'var(--golden-pollen)',
        'mustard': 'var(--mustard)',
        'royal-gold': 'var(--royal-gold)',
        'banana-cream': 'var(--banana-cream)',
        'canary-yellow': 'var(--canary-yellow)',
      },
      backgroundImage: {
        'warm-animated': 'linear-gradient(-45deg, var(--canary-yellow), var(--banana-cream), var(--tuscan-sun), var(--sandy-brown))',
      }
    },
  },
  plugins: [],
};
export default config;