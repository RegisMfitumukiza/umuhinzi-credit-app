/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edf7ef",
          100: "#d5ecd9",
          200: "#aedbb5",
          300: "#84c68c",
          400: "#5cae65",
          500: "#3f9348",
          600: "#32753b",
          700: "#285e30",
          800: "#204a27",
          900: "#17351d",
        },
        soil: {
          50: "#f8f4ee",
          100: "#efe4d2",
          200: "#e0c8a2",
          300: "#cfa86c",
          400: "#b88946",
          500: "#9a6d31",
          600: "#7c5628",
          700: "#644423",
          800: "#52381f",
          900: "#442f1a",
        },
      },
      boxShadow: {
        panel: "0 20px 45px rgba(23, 53, 29, 0.12)",
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at 1px 1px, rgba(63,147,72,0.18) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};
