import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Stage 8: backend archived to backend.archive/ — local mobile is source of truth.
  // Keeping vite dev server but proxy removed (no :3001). Frontend is now archive.
  server: {
    port: 5173,
  },
});
