/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Darker Grotesque"', 'sans-serif'],
        sans: ['"Google Sans Flex"', '"Outfit"', '"Roboto Flex"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // Zap2 Official Brand Identity (Electric Lime & Deep Charcoal Onyx)
        zap: {
          lime: "#bbf246",        // Signature Electric Lime / Cyber Green (Logo Spark)
          bright: "#ccff00",      // Hyper Neon Highlight
          light: "#d8fc6b",       // Pastel Chartreuse
          dark: "#a2d92f",        // Deep Lime
          olive: "#7da820",       // Muted Accent Olive
          muted: "#5a7a16",       // Subtle Lime Shade
        },
        studio: {
          bg: "#0d0d11",          // Deep Pure Charcoal Black
          panel: "#14141a",       // Elevated Studio Panel
          card: "#1b1b24",        // Interactive Card Surface
          border: "#2b2b38",      // Subtle Border Line
          borderHover: "#424255", // Hover State Border
          hover: "#242432",       // Hover Surface State
          accent: "#bbf246",      // Primary Focus
          textMuted: "#8e8e9c",   // Muted Secondary Text
        }
      },
      aspectRatio: {
        '9/16': '9 / 16',
      },
      boxShadow: {
        'glow-lime': '0 0 30px -4px rgba(187, 242, 70, 0.45)',
        'glow-lime-sm': '0 0 15px -2px rgba(187, 242, 70, 0.35)',
        'glow-lime-lg': '0 0 50px -5px rgba(187, 242, 70, 0.55)',
        'glow-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
