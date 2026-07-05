/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        isabel: {
          deep: {
            DEFAULT: "#0B1F3A",
            50: "#E8EDF4",
            100: "#C5D3E3",
            200: "#9FB6D0",
            300: "#7898BD",
            400: "#5A80AE",
            500: "#3D68A0",
            600: "#2D5589",
            700: "#1E4270",
            800: "#0B1F3A",
            900: "#061424",
            950: "#030A12",
          },
          indigo: {
            DEFAULT: "#4F46E5",
            50: "#EEF2FF",
            100: "#E0E7FF",
            200: "#C7D2FE",
            300: "#A5B4FC",
            400: "#818CF8",
            500: "#6366F1",
            600: "#4F46E5",
            700: "#4338CA",
            800: "#3730A3",
            900: "#312E81",
            950: "#1E1B4B",
          },
          cyan: {
            DEFAULT: "#06B6D4",
            50: "#ECFEFF",
            100: "#CFFAFE",
            200: "#A5F3FC",
            300: "#67E8F9",
            400: "#22D3EE",
            500: "#06B6D4",
            600: "#0891B2",
            700: "#0E7490",
            800: "#155E75",
            900: "#164E63",
            950: "#083344",
          },
        },
        edukids: {
          visual: { DEFAULT: "#F97316", light: "#FBBF24" },
          hearing: { DEFAULT: "#0EA5E9", light: "#22D3EE" },
          speech: { DEFAULT: "#DB2777", light: "#EC4899" },
          mobility: { DEFAULT: "#10B981", light: "#84CC16" },
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      spacing: {
        "header": "4rem",
      },
      maxWidth: {
        "content": "80rem",
      },
    },
  },
  plugins: [],
};
