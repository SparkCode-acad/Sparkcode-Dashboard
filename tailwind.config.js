/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                spark: {
                    orange: '#FF8A00',
                    purple: '#A855F7',
                    black: '#000000',
                    white: '#FDFDFD',
                }
            },
            boxShadow: {
                'neo': '4px 4px 0px 0px #000000',
                'neo-sm': '2px 2px 0px 0px #000000',
                'neo-lg': '6px 6px 0px 0px #000000',
            },
            fontFamily: {
                sans: ['"Space Grotesk"', 'sans-serif'], // We will need to import this font
            }
        },
    },
    plugins: [],
}
