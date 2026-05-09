/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"]
      },
      colors: {
        nr: {
          black: "#0a0a0a",
          white: "#ffffff",
          gray: {
            50:  "#fafafa",
            100: "#f4f4f4",
            200: "#e8e8e8",
            300: "#d0d0d0",
            400: "#a0a0a0",
            500: "#6b6b6b",
            600: "#4a4a4a",
            700: "#2a2a2a",
            800: "#1a1a1a",
            900: "#0f0f0f"
          }
        }
      }
    }
  },
  plugins: []
};
