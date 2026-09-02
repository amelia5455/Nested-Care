/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Serve the calculator at a clean /calculator instead of exposing the
  // static filename in the address bar.
  async rewrites() {
    return [{ source: '/calculator', destination: '/calculator.html' }];
  },
  async redirects() {
    return [
      { source: '/nested-calculator_25.html', destination: '/calculator', permanent: true },
      { source: '/calculator.html', destination: '/calculator', permanent: true },
    ];
  },
}
module.exports = nextConfig
