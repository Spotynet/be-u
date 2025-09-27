/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './lib/**/*.{js,ts,jsx,tsx,mdx}',
        './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Background colors
                background: 'var(--color-background)',
                'background-secondary': 'var(--color-background-secondary)',

                // Text colors
                foreground: 'var(--color-foreground)',
                'foreground-secondary': 'var(--color-foreground-secondary)',
                'foreground-muted': 'var(--color-foreground-muted)',

                // Card colors
                card: 'var(--color-card)',
                'card-foreground': 'var(--color-card-foreground)',
                'card-border': 'var(--color-card-border)',

                // Primary colors
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    foreground: 'var(--color-primary-foreground)',
                    hover: 'var(--color-primary-hover)',
                    light: 'var(--color-primary-light)',
                    dark: 'var(--color-primary-dark)',
                },

                // Secondary colors
                secondary: {
                    DEFAULT: 'var(--color-secondary)',
                    foreground: 'var(--color-secondary-foreground)',
                    hover: 'var(--color-secondary-hover)',
                    light: 'var(--color-secondary-light)',
                    dark: 'var(--color-secondary-dark)',
                },

                // Accent colors
                accent: {
                    DEFAULT: 'var(--color-accent)',
                    foreground: 'var(--color-accent-foreground)',
                    hover: 'var(--color-accent-hover)',
                },

                // Status colors
                success: {
                    DEFAULT: 'var(--color-success)',
                    foreground: 'var(--color-success-foreground)',
                    light: 'var(--color-success-light)',
                },

                warning: {
                    DEFAULT: 'var(--color-warning)',
                    foreground: 'var(--color-warning-foreground)',
                    light: 'var(--color-warning-light)',
                },

                error: {
                    DEFAULT: 'var(--color-error)',
                    foreground: 'var(--color-error-foreground)',
                    light: 'var(--color-error-light)',
                },

                // Border colors
                border: 'var(--color-border)',
                'border-light': 'var(--color-border-light)',
                'border-dark': 'var(--color-border-dark)',

                // Input colors
                input: 'var(--color-input)',
                'input-border': 'var(--color-input-border)',
                'input-focus': 'var(--color-input-focus)',

                // Ring colors (for focus states)
                ring: 'var(--color-ring)',
            },
            fontFamily: {
                sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-geist-mono)', 'monospace'],
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            boxShadow: {
                'card': 'var(--shadow-card)',
                'card-hover': 'var(--shadow-card-hover)',
                'dropdown': 'var(--shadow-dropdown)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'theme-transition': 'themeTransition 0.3s ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                themeTransition: {
                    '0%': { opacity: '0.8' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}

