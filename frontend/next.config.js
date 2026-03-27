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
      // 文案智造器 API 代理
      {
        source: "/generate_xiaohongshu",
        destination: "http://localhost:5000/generate_xiaohongshu",
      },
      {
        source: "/generate_xiaohongshu_stream",
        destination: "http://localhost:5000/generate_xiaohongshu_stream",
      },
      {
        source: "/generate_xiaohongshu_stream_post",
        destination: "http://localhost:5000/generate_xiaohongshu_stream_post",
      },
      {
        source: "/submit-form-data",
        destination: "http://localhost:5000/submit-form-data",
      },
      {
        source: "/api/product-info",
        destination: "http://localhost:5000/api/product-info",
      },
      {
        source: "/api/saved-marketing-contents",
        destination: "http://localhost:5000/api/saved-marketing-contents",
      },
      {
        source: "/api/saved-marketing-contents/:path*",
        destination: "http://localhost:5000/api/saved-marketing-contents/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
