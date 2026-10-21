/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'theme-sky',
    'theme-pink',
    'theme-lavender',
    'theme-mint',
    'theme-sunshine',
    'theme-night',
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          primary: '#7DD3FC',
          light: '#E0F7FF',
          deep: '#0284C7',
        },
        navy: {
          text: '#12356B',
          light: '#3B5998',
          muted: '#64748B',
        },
        income: '#10B981',
        expense: '#FF6475',
        btn: {
          yellow: '#FFF2CD',
          pink: '#FFE3ED',
          mint: '#D7F9ED',
          purple: '#EDE0FF',
          blue: '#DDF4FF'
        }
      },
      fontFamily: {
        prompt: ['Prompt', 'sans-serif'],
        noto: ['Noto Sans Thai', 'sans-serif'],
      },
      boxShadow: {
        'cute': '0 8px 24px -4px rgba(18, 53, 107, 0.08), 0 4px 8px -2px rgba(18, 53, 107, 0.04)',
        'cute-lg': '0 14px 34px -4px rgba(18, 53, 107, 0.12), 0 6px 14px -2px rgba(18, 53, 107, 0.06)',
        'glow-primary': '0 0 20px rgba(125, 211, 252, 0.6)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.6)'
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem'
      }
    },
  },
  plugins: [],
}
