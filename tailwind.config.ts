import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2937",
        navy: "#10233f",
        slateLine: "#d8dee8",
        catalogBlue: "#2563eb"
      },
      boxShadow: {
        page: "0 18px 60px rgba(15, 23, 42, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
