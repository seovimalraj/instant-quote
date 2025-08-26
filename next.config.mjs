/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Enable async WebAssembly and allow importing .wasm assets
    config.experiments = {
      ...(config.experiments || {}),
      asyncWebAssembly: true,
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    // Alias three/examples to three-stdlib for better tree-shaking
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "three/examples/jsm": "three-stdlib",
    };

    return config;
  },
};

export default nextConfig;
