/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        primary: {
          DEFAULT: "var(--color-primary)",
          container: "var(--color-primary-container)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          container: "var(--color-secondary-container)",
        },
        tertiary: {
          DEFAULT: "var(--color-tertiary)",
          container: "var(--color-tertiary-container)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          bright: "var(--color-surface-bright)",
          dim: "var(--color-surface-dim)",
          container: {
            DEFAULT: "var(--color-surface-container)",
            lowest: "var(--color-surface-container-lowest)",
            low: "var(--color-surface-container-low)",
            high: "var(--color-surface-container-high)",
            highest: "var(--color-surface-container-highest)",
          }
        },
        "on-background": "var(--color-on-background)",
        "on-surface": "var(--color-on-surface)",
        "on-surface-variant": "var(--color-on-surface-variant)",
        outline: "var(--color-outline)",
        "outline-variant": "var(--color-outline-variant)",
        error: {
          DEFAULT: "var(--color-error)",
          container: "var(--color-error-container)",
        }
      },
      borderRadius: {
        DEFAULT: "var(--border-radius-default)",
        lg: "var(--border-radius-lg)",
        xl: "var(--border-radius-xl)",
      },
      fontFamily: {
        headline: ["var(--font-headline)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        label: ["var(--font-label)", "sans-serif"],
      },
      spacing: {
        unit: "var(--spacing-unit)",
        gutter: "var(--spacing-gutter)",
        "container-margin": "var(--spacing-container-margin)",
        "section-gap": "var(--spacing-section-gap)",
      }
    },
  },
  plugins: [],
}
