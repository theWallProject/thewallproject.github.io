import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false, // Disable source maps in production for smaller bundle
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          "react-vendor": ["react", "react-dom"],
          router: ["react-router-dom"],
          i18n: [
            "i18next",
            "react-i18next",
            "i18next-browser-languagedetector",
          ],
          utils: ["bowser"],
        },
      },
    },
    // Enable minification and compression
    minify: "terser",
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
