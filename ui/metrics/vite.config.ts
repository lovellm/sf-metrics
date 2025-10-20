import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(
      new Date()
        .toISOString()
        .replace(/[^0-9]/g, "")
        .substring(3, 10),
    ),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        configure(proxy) {
          proxy.on("proxyReq", (proxyReq, _, res) => {
            res.on("close", () => {
              if (!res.writableEnded) {
                proxyReq.destroy();
              }
            });
          });
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
