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
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
      },
      perspective: {
        '1000': '1000px',
      },
      rotate: {
        'x-3': 'rotateX(3deg)',
        'x-10': 'rotateX(10deg)',
        'y-3': 'rotateY(3deg)',
        'y-5': 'rotateY(5deg)',
      },
      transformStyle: {
        'preserve-3d': 'preserve-3d',
      },
      translate: {
        'z-20': 'translateZ(20px)',
        'z-40': 'translateZ(40px)',
      },
      animation: {
        'text-reveal': 'text-reveal 1.5s ease-out forwards',
        'fade-in-up': 'fade-in-up 1s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.8s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.8s ease-out forwards',
        'slide-in-bottom': 'slide-in-bottom 0.8s ease-out forwards',
        'slider-left': 'slide-left 40s linear infinite',
        'slider-right': 'slide-right 40s linear infinite'
      },
      keyframes: {
        'text-reveal': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px) scale(0.95)',
            letterSpacing: '0.2em',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
            letterSpacing: '0.2em',
          },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slide-in-left': {
          '0%': {
            opacity: '0',
            transform: 'translateX(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'slide-in-right': {
          '0%': {
            opacity: '0',
            transform: 'translateX(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'slide-in-bottom': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'slide-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        'slide-right': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' }
        }
      },
    },
  },
  plugins: [],
}

