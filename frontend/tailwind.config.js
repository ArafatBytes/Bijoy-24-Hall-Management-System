/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: "#fdf2f2",
          100: "#fce7e7",
          200: "#f9d2d2",
          300: "#f4b1b1",
          400: "#ec8585",
          500: "#e05d5d",
          600: "#cc3f3f",
          700: "#ab2f2f",
          800: "#8e2929",
          900: "#762727",
          950: "#401111",
        },
        cream: {
          50: "#fefefe",
          100: "#fdfdfd",
          200: "#fbfbfb",
          300: "#f8f8f8",
          400: "#f5f5f5",
          500: "#f1f1f1",
          600: "#e8e8e8",
          700: "#d1d1d1",
          800: "#b4b4b4",
          900: "#8a8a8a",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-pattern": "url('/images/bijoy24hall.jpeg')",
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-in-out",
        "slide-up": "slideUp 0.8s ease-out",
        "slide-down": "slideDown 0.8s ease-out",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-30px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        bijoy24: {
          primary: "#8e2929",
          "primary-content": "#ffffff",
          secondary: "#ab2f2f",
          "secondary-content": "#ffffff",
          accent: "#cc3f3f",
          "accent-content": "#ffffff",
          neutral: "#f1f1f1",
          "neutral-content": "#2a2a2a",
          "base-100": "#ffffff",
          "base-200": "#fefefe",
          "base-300": "#f8f8f8",
          "base-content": "#2a2a2a",
          info: "#3b82f6",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
        },
        bijoy24dark: {
          primary: "#8e2929",
          "primary-content": "#ffffff",
          secondary: "#ab2f2f",
          "secondary-content": "#ffffff",
          accent: "#cc3f3f",
          "accent-content": "#ffffff",
          neutral: "#2d2d2d",
          "neutral-content": "#e5e5e5",
          "base-100": "#1a1a1a",
          "base-200": "#232323",
          "base-300": "#2d2d2d",
          "base-content": "#e5e5e5",
          info: "#3b82f6",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    ],
  },
};
