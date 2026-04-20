"use client"

import dynamic from "next/dynamic"

// 动态导入主布局，减少首屏加载时间
const MainLayout = dynamic(
  () => import("@/components/layout/main-layout").then(mod => ({ default: mod.MainLayout })),
  {
    loading: () => <MainLayoutLoading />,
    ssr: false
  }
)

// 轻量级 Loading 组件
function MainLayoutLoading() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 侧边栏骨架 */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] shrink-0 flex-col overflow-hidden border-r border-border bg-secondary md:static">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <div className="size-9 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-1">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="flex-1 space-y-2 p-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </aside>
      
      {/* 主内容区骨架 */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* 头部骨架 */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
        </header>
        {/* 内容区骨架 */}
        <main className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function MainGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>{children}</MainLayout>
  )
}
