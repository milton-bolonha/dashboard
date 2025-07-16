/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/containers/**/*.{js,jsx,ts,tsx}",
    "./src/templates/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0284C7",
          light: "#0EA5E9",
          dark: "#0369A1",
        },
        text: {
          main: "#1F2937", // gray-800
          light: "#6B7280", // gray-500
        },
        background: {
          light: "#F9FAFB", // gray-50
          dark: "#111827", // gray-900
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.text.main'),
            h1: {
              color: theme('colors.primary.dark'),
            },
            h2: {
              color: theme('colors.primary.dark'),
            },
            h3: {
              color: theme('colors.primary.DEFAULT'),
            },
            strong: {
              color: theme('colors.primary.dark'),
            },
          },
        },
      }),
      animation: {
        marquee: "marquee 25s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
