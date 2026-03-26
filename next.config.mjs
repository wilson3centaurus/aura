/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow cross-origin requests from any device on the local network
  // (required when accessing the dev server from tablets/phones on the same Wi-Fi)
  allowedDevOrigins: ['*'],
}

export default nextConfig
