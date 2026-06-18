import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./entities/**/*.{ts,tsx}",
    "./shared/**/*.{ts,tsx}",
    "./server/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#15211d",
        mist: "#edf1ed",
        pine: "#184d3f",
        pineSoft: "#d9e8de",
        navy: "#163250",
        sand: "#f4efe6",
        muted: "#62736a"
      },
      fontFamily: {
        sans: ["Aptos", "PingFang SC", "Microsoft YaHei UI", "sans-serif"],
        display: ["Bahnschrift", "Segoe UI Variable", "sans-serif"]
      },
      boxShadow: {
        soft: "0 26px 80px rgba(22, 38, 33, 0.1)"
      },
      borderRadius: {
        shell: "30px"
      }
    }
  },
  plugins: []
};

export default config;
