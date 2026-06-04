/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  // S3 SDK and other server-only packages should not be bundled for the browser.
  serverExternalPackages: ["@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"],
  eslint: {
    // Lint is run separately in CI; do not block production builds on lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
