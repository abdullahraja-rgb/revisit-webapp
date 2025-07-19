import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        foreground: "#4c4c4c",
        primary: {
          DEFAULT: "#005fee",  // Accent 1
          hover: "#004bcc",    // Slightly darker for hover state
        },
      },
    },
  },
  plugins: [],
};

export default config;
