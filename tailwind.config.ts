import { type Config } from "tailwindcss";

export default {
  darkMode: 'class', // Add this line
  content: [
    "{routes,islands,components}/**/*.{ts,tsx,js,jsx}",
  ],
} satisfies Config;
