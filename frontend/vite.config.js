// Vite config: React plugin plus a dev proxy so /api/* reaches Flask on :5000.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the backend to avoid CORS during development.
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
      },
    },
  },
});
