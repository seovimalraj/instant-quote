/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(stl|obj|dxf)$/i,
      type: "asset/resource",
    });
    return config;
  },
};

export default nextConfig;
