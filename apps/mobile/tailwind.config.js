/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("uniwind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist_400Regular", "system-ui", "sans-serif"],
        medium: ["Geist_500Medium", "system-ui", "sans-serif"],
        semibold: ["Geist_600SemiBold", "system-ui", "sans-serif"],
        bold: ["Geist_700Bold", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
