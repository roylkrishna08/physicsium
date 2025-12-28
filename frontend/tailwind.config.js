/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    corePlugins: {
        preflight: false,
    },
    theme: {
        extend: {
            colors: {
                // keeping legacy for safety if needed, can serve as aliases or fallbacks
                indigo: { 950: '#1e1b4b' },
                amber: { 600: '#d97706' },
                slate: { 50: '#f8fafc', 100: '#f1f5f9', 800: '#1e293b' }
            }
        },
    },
    plugins: [],
}
