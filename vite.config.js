import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
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
        "/api": {
          target: env.VITE_API_TARGET || "http://172.17.107.221:8082",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, "/v1"),
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