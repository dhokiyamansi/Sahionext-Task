/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // onnxruntime-web ships browser wasm; keep it out of the server bundle.
  serverExternalPackages: ["onnxruntime-web", "@ricky0123/vad-web"],
};

export default nextConfig;
