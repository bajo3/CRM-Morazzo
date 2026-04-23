/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f4f1ea",
        ink: "#1f2521",
        line: "#d5d0c5",
        accent: "#285e61",
        accentSoft: "#d7ebe8",
        success: "#2f6a45",
        warning: "#a3681d",
        danger: "#9a3d32",
      },
      fontFamily: {
        sans: ["'Segoe UI'", "Tahoma", "Geneva", "Verdana", "sans-serif"],
      },
      boxShadow: {
        panel: "0 12px 30px rgba(31, 37, 33, 0.08)",
      },
    },
  },
  plugins: [],
};

