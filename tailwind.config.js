/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Warm luxury palette: sunset terracotta and gold over warm sand.
        accent: "#C2410C",
        "accent-deep": "#9A3412",
        gold: "#C8A253",
        ink: "#2B1A12",
        subtle: "#6F5848",
        sand: "#FBF4EC"
      },
      borderRadius: {
        card: "28px"
      }
    }
  },
  plugins: []
};
