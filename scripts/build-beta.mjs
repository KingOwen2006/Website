import { execFileSync } from "node:child_process";
import { cpSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv } from "vite";

function build(prefix, env = process.env) {
  execFileSync(process.execPath, [process.env.npm_execpath, "run", "build", "--prefix", prefix], {
    env,
    stdio: "inherit",
  });
}

const config = {
  ...loadEnv("production", resolve("admin"), ""),
  ...loadEnv("production", process.cwd(), ""),
  ...process.env,
};
build("portfolio", {
  ...process.env,
  VITE_EDUCATION_SAME_ORIGIN: "true",
  VITE_SANITY_PROJECT_ID: config.SANITY_PROJECT_ID || config.VITE_SANITY_PROJECT_ID || "bxr88bn5",
  VITE_SANITY_DATASET: config.SANITY_DATASET || config.VITE_SANITY_DATASET || "production",
  VITE_SANITY_API_VERSION: config.SANITY_API_VERSION || config.VITE_SANITY_API_VERSION || "2025-01-01",
});
build("admin", { ...process.env, BETA_ADMIN: "true" });
cpSync("public", "portfolio/dist", { recursive: true, force: false });
cpSync(
  "portfolio/node_modules/@fontsource-variable/google-sans-flex/files/google-sans-flex-latin-wdth-normal.woff2",
  "portfolio/dist/fonts/google-sans-flex.woff2",
);
cpSync("admin/dist", "portfolio/dist/admin", { recursive: true });
