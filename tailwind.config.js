/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './popup/**/*.{html,tsx,ts}',
        './options/**/*.{html,tsx,ts}',
        './src/**/*.{tsx,ts,html}',
    ],
    theme: {
        extend: {
            fontSize: {
                's': ['1rem', { lineHeight: '1.25rem' }],
            },
            colors: {
                surface: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                accent: {
                    DEFAULT: '#6366f1',
                    hover: '#4f46e5',
                    light: '#818cf8',
                    muted: '#312e81',
                },
                danger: {
                    DEFAULT: '#ef4444',
                    hover: '#dc2626',
                },
                success: {
                    DEFAULT: '#22c55e',
                    hover: '#16a34a',
                },
                warning: {
                    DEFAULT: '#f59e0b',
                    light: '#fef3c7',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
        },
    },
    plugins: [],
};
