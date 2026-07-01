import { existsSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "public", "vad");
mkdirSync(dest, { recursive: true });

const vadDist = join(root, "node_modules", "@ricky0123", "vad-web", "dist");
const ortDist = join(root, "node_modules", "onnxruntime-web", "dist");

const vadFiles = [
  "vad.worklet.bundle.min.js",
  "silero_vad_v5.onnx",
  "silero_vad_legacy.onnx",
];

let copied = 0;
for (const f of vadFiles) {
  const src = join(vadDist, f);
  if (existsSync(src)) {
    copyFileSync(src, join(dest, f));
    copied++;
  } else {
    console.warn(`[copy-vad-assets] missing VAD asset: ${f}`);
  }
}

if (existsSync(ortDist)) {
  for (const f of readdirSync(ortDist)) {
    if (/^ort-wasm-simd-threaded.*\.(wasm|mjs)$/.test(f)) {
      copyFileSync(join(ortDist, f), join(dest, f));
      copied++;
    }
  }
} else {
  console.warn("[copy-vad-assets] onnxruntime-web dist not found");
}

console.log(`[copy-vad-assets] copied ${copied} files -> public/vad`);
