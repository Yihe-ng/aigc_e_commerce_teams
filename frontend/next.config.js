/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // 注释掉静态导出
  reactStrictMode: true,
  // 恢复 rewrites 代理，让 Next.js 自动转发 API 请求到 Flask (5000)
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

export default nextConfig;
