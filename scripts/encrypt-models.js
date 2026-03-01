#!/usr/bin/env node
/**
 * Encrypts GLB model files for secure web delivery.
 * Run: node scripts/encrypt-models.js
 *
 * Reads models-config.json to find models with encrypted: true,
 * XOR-encrypts each .glb file, and writes .glb.enc to the Models folder.
 * The original .glb files are kept; you can delete them after verifying.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "models-config.json");

function xorCrypt(data, key) {
  const keyBytes = Buffer.from(key, "utf8");
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return out;
}

function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("models-config.json not found");
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  const key = process.env.MODEL_ENCRYPT_KEY || config.encryptionKey || "default-key-change-me";
  const models = config.models || {};
  const modelsDirName = config.modelsDir || "Models";
  const MODELS_DIR = path.resolve(ROOT, modelsDirName);

  if (!fs.existsSync(MODELS_DIR)) {
    console.error("Models folder not found:", MODELS_DIR);
    process.exit(1);
  }

  let count = 0;
  for (const [filename, opts] of Object.entries(models)) {
    if (!opts.encrypted) continue;
    if (!filename.endsWith(".glb")) continue;

    const srcPath = path.join(MODELS_DIR, filename);
    const encPath = path.join(MODELS_DIR, filename + ".enc");

    if (!fs.existsSync(srcPath)) {
      console.warn("Skip (not found):", filename);
      continue;
    }

    const data = fs.readFileSync(srcPath);
    const encrypted = xorCrypt(data, key);
    fs.writeFileSync(encPath, encrypted);
    console.log("Encrypted:", filename, "->", filename + ".enc");
    count++;
  }

  console.log("Done. Encrypted", count, "model(s).");
}

main();
