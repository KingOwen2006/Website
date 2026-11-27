import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import { fileURLToPath } from "node:url";
import { catalog, checkout, status, webhook } from "../server/shop";

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
    plugins: [{
      name: "shop-api",
      configureServer(server) {
        const config = loadEnv(mode, fileURLToPath(new URL("../", import.meta.url)), "");
        for (const key of ["SANITY_API_TOKEN", "SANITY_PROJECT_ID", "SANITY_DATASET", "STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET", "SITE_URL"]) {
          if (!process.env[key] && config[key]) process.env[key] = config[key];
        }
        server.middlewares.use((req, res, next) => {
          const routes = {"/api/shop": catalog, "/api/checkout": checkout, "/api/order-status": status, "/api/stripe-webhook": webhook};
          const route = routes[(req.url ?? "").split("?")[0] as keyof typeof routes];
          if (route) void route(req, res).catch(next);
          else next();
        });
      },
    }],
    build: {
      rollupOptions: {
        input: [
          fileURLToPath(new URL("./shop/index.html", import.meta.url)),
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
