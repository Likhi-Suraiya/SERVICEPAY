import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: "web.config",
            dest: ".",
          },
        ],
      }),
    ],
    base: "/",
    server: {
      headers: {
        "Cache-Control": "no-store",
      },
      proxy: {
        "/api": {  // Changed from /apihris to match web.config
          //  target: env.VITE_HRIS || "https://localhost:7129",
          target: env.VITE_URL_1 || "http://care360.propertylifts.com", // Changed to match the proxy rule
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, "/v1"), // Changed to match the proxy rule
        },
      },
      historyApiFallback: true,
    },
    build: {
      outDir: "dist",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            axios: ['axios'],
          },
        },
      },
    },
  };
});