import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

/**
 * Design tokens — single source of truth is design.md.
 * Colors use the default Tailwind palette (design.md maps every token to a default class);
 * only values with no default equivalent are defined here.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
      },
      colors: {
        // Fixed project color set (design.md §1 "Project colors")
        project: {
          indigo: '#4F46E5',
          sky: '#0EA5E9',
          emerald: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
          violet: '#8B5CF6',
          pink: '#EC4899',
          teal: '#14B8A6',
        },
      },
    },
  },
  plugins: [],
};

export default config;
