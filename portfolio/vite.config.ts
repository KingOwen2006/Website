import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_SANITY_");
  const projectId = env.VITE_SANITY_PROJECT_ID || "bxr88bn5";
  const proxy: Record<string, ProxyOptions> = {
    "^/api/sanity-public/v[^/]+/data/query/": {
      target: `https://${projectId}.api.sanity.io`,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/sanity-public/, ""),
      configure: (server) => {
        server.on("proxyReq", (request) => {
          request.removeHeader("origin");
          request.removeHeader("cookie");
          request.removeHeader("authorization");
        });
      },
    },
  };
  return {
    build: {
      rollupOptions: {
        input: [
          fileURLToPath(new URL("./index.html", import.meta.url)),
          fileURLToPath(new URL("./education/index.html", import.meta.url)),
          fileURLToPath(new URL("./feed/index.html", import.meta.url)),
          fileURLToPath(new URL("./settings/index.html", import.meta.url)),
        ],
      },
    },
    server: { proxy },
    preview: { proxy },
  };
});
