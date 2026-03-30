"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { MainHeader } from "./main-header"
import { MainSidebar } from "./main-sidebar"
import { SIDEBAR_COLLAPSED_KEY } from "./nav-config"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  /** 仅 md+：收窄为图标栏；移动端抽屉始终为完整宽度 */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarPrefsReady, setSidebarPrefsReady] = useState(false)

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") {
        setSidebarCollapsed(true)
      }
    } catch {
      /* ignore */
    }
    setSidebarPrefsReady(true)
  }, [])

  useEffect(() => {
    if (!sidebarPrefsReady || typeof window === "undefined") return
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed, sidebarPrefsReady])

  /** 从窄屏切到桌面时关闭抽屉，避免与桌面侧栏状态叠加 */
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 768px)")
    const onChange = () => {
      if (mq.matches) setSidebarOpen(false)
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((v) => !v)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="关闭菜单"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <MainSidebar
        pathname={pathname}
        sidebarOpen={sidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
        onCloseMobile={() => setSidebarOpen(false)}
        onNavigate={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <MainHeader
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebarCollapsed}
          onOpenMobileSidebar={() => setSidebarOpen(true)}
        />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
