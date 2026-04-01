"use client"

import { Button, Surface } from "@heroui/react"
import { LogOut, PanelLeft, PanelLeftClose, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

import { BRAND_LOGO_SRC } from "./nav-config"
import { NavItems } from "./nav-items"

export type MainSidebarProps = {
  pathname: string | null
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  onToggleCollapsed: () => void
  onCloseMobile: () => void
  onNavigate: () => void
}

export function MainSidebar({
  pathname,
  sidebarOpen,
  sidebarCollapsed,
  onToggleCollapsed,
  onCloseMobile,
  onNavigate,
}: MainSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[260px] shrink-0 flex-col overflow-x-hidden border-r border-border transition-[width,transform] duration-200 ease-out md:static md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        sidebarCollapsed && "md:w-[72px]",
      )}
    >
      <Surface
        variant="secondary"
        className="flex h-full min-h-0 flex-col rounded-none border-0 shadow-none"
      >
        <div
          className={cn(
            "flex shrink-0 items-center gap-2 border-b border-border px-4",
            sidebarCollapsed
              ? "h-14 md:h-auto md:flex-col md:justify-center md:gap-2 md:py-3 md:px-2"
              : "h-14",
          )}
        >
          <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-muted">
            <Image
              src={BRAND_LOGO_SRC}
              alt="智行合一"
              width={36}
              height={36}
              className="size-9 object-contain"
              sizes="36px"
              priority
            />
          </div>
          <div className={cn("min-w-0 flex-1", sidebarCollapsed && "md:hidden")}>
            <p className="truncate text-sm font-semibold">智创电商</p>
            <p className="truncate text-xs text-muted-foreground">营销控制台</p>
          </div>
          <Button
            isIconOnly
            variant="ghost"
            className="hidden md:flex"
            aria-label={sidebarCollapsed ? "展开侧栏" : "收起侧栏"}
            aria-expanded={!sidebarCollapsed}
            onPress={onToggleCollapsed}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="size-5 opacity-60" aria-hidden />
            ) : (
              <PanelLeftClose className="size-5 opacity-60" aria-hidden />
            )}
          </Button>
          <Button
            isIconOnly
            variant="ghost"
            className="md:hidden"
            aria-label="关闭菜单"
            onPress={onCloseMobile}
          >
            <X className="size-5" />
          </Button>
        </div>
        <NavItems pathname={pathname} collapsed={sidebarCollapsed} onNavigate={onNavigate} />
        <div className={cn("mt-auto border-t border-border p-3", sidebarCollapsed && "md:p-2")}>
          <Link
            href="/login"
            title="退出到登录"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground",
              sidebarCollapsed && "md:justify-center md:gap-0 md:px-2",
            )}
            onClick={onCloseMobile}
          >
            <LogOut className="size-5 shrink-0" aria-hidden />
            <span className={cn(sidebarCollapsed && "md:sr-only")}>退出到登录</span>
          </Link>
        </div>
      </Surface>
    </aside>
  )
}
