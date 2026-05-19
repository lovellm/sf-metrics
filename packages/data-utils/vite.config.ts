import { defineConfig } from "vite";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import dts from "unplugin-dts/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({ tsconfigPath: "./tsconfig.build.json", bundleTypes: true }),
  ],
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
    lib: {
      entry: resolve(import.meta.dirname, "lib/main.ts"),
      formats: ["es"],
    },
    rollupOptions: {
      external: ["react", "react/jsx-runtime", "tailwindcss"],
      output: {
        assetFileNames: "assets/[name][extname]",
        entryFileNames: "[name].js",
      },
    },
    copyPublicDir: false,
  },
});
