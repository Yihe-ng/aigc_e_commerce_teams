/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // 配置API代理
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:5000/api/:path*' // Flask后端地址
            }
        ]
    }
}

module.exports = nextConfig