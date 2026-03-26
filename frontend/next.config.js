const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // 娉ㄩ噴鎺夐潤鎬佸鍑?
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  // 鎭㈠ rewrites 浠ｇ悊锛岃 Next.js 鑷姩杞彂 API 璇锋眰鍒?Flask (5000)
  async rewrites() {
    return [
      {
        source: "/login",
        destination: "/",
      },
      {
        source: "/api/login",
        destination: "http://localhost:3002/api/login", // Login server
      },
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*", // Flask backend
      },
    ];
  },
};

module.exports = nextConfig;
