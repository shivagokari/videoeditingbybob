/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow high performance video buffer uploads for preview/export api
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
      ],
    },
  ],
};

export default nextConfig;
