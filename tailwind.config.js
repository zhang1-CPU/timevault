/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      // Inter-style system font stack — warm, modern sans for body text
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      // Cormorant Garamond-style serif stack — romantic, poetic headings
      serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      mono: ['Consolas', '"Courier New"', 'monospace'],
    },
    extend: {
      colors: {
        // Brand palette: rose → violet → cyan (matches static site hero)
        brand: {
          rose: '#f472b6',
          roseDeep: '#e11d48',
          violet: '#8b5cf6',
          violetDeep: '#6366f1',
          cyan: '#22d3ee',
          gold: '#f59e0b',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        breathe: {
          "0%,100%": { transform: "scale(1)", opacity: "0.85" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
        "sand-fall": {
          "0%": { transform: "translateY(-40%)", opacity: "0.2" },
          "50%": { opacity: "0.9" },
          "100%": { transform: "translateY(55%)", opacity: "0" },
        },
        "hourglass-twinkle": {
          "0%,100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0) translateX(0)", opacity: "0" },
          "10%": { opacity: "0.7" },
          "90%": { opacity: "0.7" },
          "100%": { transform: "translateY(-100vh) translateX(30px)", opacity: "0" },
        },
        "soft-glow": {
          "0%,100%": { boxShadow: "0 0 20px rgba(225, 120, 140, 0.2), 0 0 60px rgba(180, 140, 220, 0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(225, 120, 140, 0.4), 0 0 100px rgba(180, 140, 220, 0.2)" },
        },
        twinkle: {
          "0%,100%": { opacity: "0.2", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.25)" },
        },
        "typewriter": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        rotate: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        shimmer: "shimmer 4s linear infinite",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        breathe: "breathe 4s ease-in-out infinite",
        "sand-fall": "sand-fall 3.5s ease-in-out infinite",
        "hourglass-twinkle": "hourglass-twinkle 2.2s ease-in-out infinite",
        float: "float linear infinite",
        "soft-glow": "soft-glow 3s ease-in-out infinite",
        twinkle: "twinkle 2s ease-in-out infinite",
        "typewriter": "typewriter 0.6s ease-out forwards",
        "rotate-slow": "rotate 20s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
