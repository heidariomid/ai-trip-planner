const { colors } = require("./lib/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    // Outfit ships one file per weight, so a weight is a family here.
    // `fontWeight` is emptied so `font-bold` sets the family alone and the
    // platform does not synthesise a second bold on top of it. The regular
    // weight is `font-regular`, not `font-sans`: the NativeWind preset pins
    // `sans` to the system font on native.
    fontFamily: {
      regular: ["Outfit_400Regular"],
      medium: ["Outfit_500Medium"],
      semibold: ["Outfit_600SemiBold"],
      bold: ["Outfit_700Bold"],
      // Persian text. `components/Text.tsx` swaps to these by weight.
      "fa-regular": ["IRANSansX_400Regular"],
      "fa-medium": ["IRANSansX_500Medium"],
      "fa-semibold": ["IRANSansX_600DemiBold"],
      "fa-bold": ["IRANSansX_700Bold"]
    },
    fontWeight: {},
    extend: {
      colors,
      borderRadius: {
        card: "24px"
      }
    }
  },
  plugins: []
};
