import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '数字人live页面',
}

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return children
}
