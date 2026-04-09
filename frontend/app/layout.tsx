import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { ThemeProvider } from '@/components/theme/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '智创电商营销系统',
  description: '基于 AIGC 的新电商数字化营销技术研究与创新应用',
  icons: {
    icon: 'http://localhost:5000/static/images/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 预连接 CDN 加速加载 */}
        <link rel="preconnect" href="https://cubism.live2d.com" />
        <link rel="dns-prefetch" href="https://cubism.live2d.com" />
        {/* 预加载 Live2D 运行时 */}
        <link rel="preload" href="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js" as="script" /> 
        <script src="https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js" async />
      </head>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
