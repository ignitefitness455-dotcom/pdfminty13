/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./scripts/**/*.{js,ts,cjs,mjs}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: [
          'Sora',
          'Plus Jakarta Sans',
          'Hind Siliguri',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        sans: [
          'Plus Jakarta Sans',
          'Sora',
          'Hind Siliguri',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        background: 'var(--custom-bg)',
        'on-background': 'var(--custom-on-bg)',
        'primary-fixed': 'var(--custom-primary-fixed)',
        'primary-fixed-dim': 'var(--custom-primary-fixed-dim)',
        'security-green': 'var(--custom-security-green)',
        primary: 'var(--custom-primary)',
        'on-primary': 'var(--custom-on-primary)',

        surface: 'var(--custom-surface)',
        'on-surface': 'var(--custom-on-surface)',
        'surface-dim': 'var(--custom-surface-dim)',
        'surface-bright': 'var(--custom-surface-bright)',
        'surface-variant': 'var(--custom-surface-variant)',
        'on-surface-variant': 'var(--custom-on-surface-variant)',
        'inverse-surface': 'var(--custom-inverse-surface)',
        'inverse-on-surface': 'var(--custom-inverse-on-surface)',

        'surface-container-lowest': 'var(--custom-surface-lowest)',
        'surface-container-low': 'var(--custom-surface-low)',
        'surface-container': 'var(--custom-surface-container)',
        'surface-container-high': 'var(--custom-surface-container-high)',
        'surface-container-highest': 'var(--custom-surface-container-highest)',

        'border-muted': 'var(--custom-border-muted)',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}

