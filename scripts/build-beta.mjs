import { execFileSync } from "node:child_process";
import { loadEnv } from "vite";

function build(prefix, env = process.env) {
  execFileSync(process.execPath, [process.env.npm_execpath, "run", "build", "--prefix", prefix], {
    env,
    stdio: "inherit",
  });
}

const config = {
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
