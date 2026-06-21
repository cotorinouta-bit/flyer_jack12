import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react()],
  build: { assetsDir: "static" },
  server: { port: 5173, host: true },
});
