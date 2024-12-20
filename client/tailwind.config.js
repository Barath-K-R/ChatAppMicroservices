/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeOut: {
          '0%': { backgroundColor: 'rgba(254, 243, 199, 1)' }, 
          '100%': { backgroundColor: 'rgba(255, 255, 255, 0)' }, 
        },
      },      
      animation: {
        fadeOut: 'fadeOut 4s forwards', 
      },
    },
  },
  plugins: [],
};
