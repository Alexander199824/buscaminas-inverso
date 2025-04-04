/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        animation: {
          bounce: 'bounce 1s infinite',
          pulse: 'pulse 1.5s infinite',
          ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        },
      },
    },
    plugins: [],
  }