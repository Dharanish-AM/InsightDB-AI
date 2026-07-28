export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0B0F17",
          card: "#111827",
          border: "rgba(255, 255, 255, 0.08)",
          hover: "#1F2937",
        },
      },
    },
  },
  plugins: [],
};
