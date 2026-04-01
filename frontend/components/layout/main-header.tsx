"use client"

import {
  Avatar,
  Button,
  Dropdown,
  Input,
  Label,
  Separator,
  TextField,
} from "@heroui/react"
import { Bell, Menu, PanelLeft, PanelLeftClose, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { ThemeToggle } from "@/components/theme/theme-toggle"
import { cn } from "@/lib/utils"

export type MainHeaderProps = {
  sidebarCollapsed: boolean
  onToggleCollapsed: () => void
  onOpenMobileSidebar: () => void
}

export function MainHeader({ sidebarCollapsed, onToggleCollapsed, onOpenMobileSidebar }: MainHeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const blurCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearBlurTimer = useCallback(() => {
    if (blurCloseTimerRef.current != null) {
      clearTimeout(blurCloseTimerRef.current)
      blurCloseTimerRef.current = null
    }
  }, [])

  useEffect(() => () => clearBlurTimer(), [clearBlurTimer])

  const handleSearchFocus = useCallback(() => {
    clearBlurTimer()
    setSearchFocused(true)
  }, [clearBlurTimer])

  const handleSearchBlur = useCallback(() => {
    clearBlurTimer()
    blurCloseTimerRef.current = setTimeout(() => {
      setSearchFocused(false)
    }, 160)
  }, [clearBlurTimer])

  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
    clearBlurTimer()
  }, [clearBlurTimer])

  return (
    <header className="relative sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:gap-3 sm:px-4">
      <Button
        isIconOnly
        variant="ghost"
        aria-label="打开菜单"
        className="md:hidden"
        onPress={onOpenMobileSidebar}
      >
        <Menu className="size-5" />
      </Button>
      <Button
        isIconOnly
        variant="ghost"
        aria-label={sidebarCollapsed ? "展开侧栏" : "收起侧栏"}
        aria-expanded={!sidebarCollapsed}
        className="hidden md:flex"
        onPress={onToggleCollapsed}
      >
        {sidebarCollapsed ? (
          <PanelLeft className="size-5 opacity-60" aria-hidden />
        ) : (
          <PanelLeftClose className="size-5 opacity-60" aria-hidden />
        )}
      </Button>
      <div
        className={cn(
          "min-w-0 flex-1 transition-all duration-300 ease-out",
          searchFocused && "lg:max-w-0 lg:opacity-0 lg:overflow-hidden",
        )}
      >
        <h1 className="truncate text-sm font-semibold sm:text-base">控制台</h1>
      </div>

      {/* lg+：聚焦时居中拉长；未聚焦时靠右窄条。单层圆角容器 + 对称阴影，避免与 Input 自带阴影错位 */}
      <div
        className={cn(
          "relative isolate hidden shrink-0 overflow-hidden rounded-full border border-border/70 bg-background transition-[width,max-width,transform,box-shadow] duration-300 ease-out dark:border-white/22 lg:block",
          searchFocused
            ? "absolute left-1/2 top-1/2 z-20 w-[min(42rem,calc(100%-7rem))] max-w-[min(42rem,calc(100%-7rem))] -translate-x-1/2 -translate-y-1/2 border-border bg-background/95 backdrop-blur-sm dark:border-white/38 dark:bg-background/95 [box-shadow:0_0_0_1px_hsl(var(--border)),0_10px_32px_-6px_rgba(15,23,42,0.22),0_4px_12px_-2px_rgba(15,23,42,0.12)] dark:[box-shadow:0_0_0_1px_rgba(255,255,255,0.26),0_12px_36px_-6px_rgba(0,0,0,0.55),0_4px_14px_-2px_rgba(0,0,0,0.35)]"
            : "w-[min(20rem,26vw)] max-w-xs [box-shadow:0_1px_3px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.08)] dark:[box-shadow:0_1px_3px_rgba(0,0,0,0.35),0_2px_10px_rgba(0,0,0,0.22)]",
        )}
      >
        <TextField aria-label="搜索" name="q" className="w-full">
          <Label className="sr-only">搜索</Label>
          <div className="relative">
            <Input
              placeholder="搜索菜单、订单、商品…"
              variant="secondary"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className={cn(
                "h-10 min-h-10 w-full rounded-full border-0 bg-transparent pr-10 !shadow-none ring-0 focus-visible:!ring-0",
                "data-[focus-visible]:!ring-0",
              )}
            />
            {searchQuery ? (
              <Button
                type="button"
                isIconOnly
                variant="ghost"
                size="sm"
                aria-label="清除搜索"
                className="absolute right-1 top-1/2 z-10 size-8 min-h-8 min-w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onMouseDown={(e) => e.preventDefault()}
                onPress={handleClearSearch}
              >
                <X className="size-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        </TextField>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <ThemeToggle />
        <Button isIconOnly variant="ghost" aria-label="通知">
          <Bell className="size-5" />
        </Button>
        <Dropdown>
          <Button
            variant="ghost"
            className={cn(
              "inline-flex h-9 min-h-9 shrink-0 items-center gap-2.5 rounded-lg border-0 bg-transparent p-0 shadow-none",
              "hover:!bg-transparent active:!bg-transparent",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            <Avatar className="size-8 shrink-0 ring-2 ring-background">
              <Avatar.Fallback className="bg-foreground/10 text-[11px] font-semibold leading-none text-foreground dark:bg-white/15">
                管
              </Avatar.Fallback>
            </Avatar>
            <span
              className={cn(
                "hidden max-w-[4.5rem] truncate rounded-full border border-border/45 bg-muted/80 px-1.5 py-1 text-sm font-medium leading-none shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
                "dark:border-border/60 dark:bg-muted/50 dark:shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
                "sm:inline-flex sm:items-center sm:justify-center",
              )}
            >
              管理员
            </span>
          </Button>
          <Dropdown.Popover className="min-w-[200px]">
            <Dropdown.Menu
              onAction={(key) => {
                if (key === "logout") router.push("/login")
              }}
            >
              <Dropdown.Item id="profile" textValue="个人设置">
                <Label>个人设置</Label>
              </Dropdown.Item>
              <Dropdown.Item id="team" textValue="团队">
                <Label>团队与权限</Label>
              </Dropdown.Item>
              <Separator className="my-1" />
              <Dropdown.Item id="logout" textValue="退出登录" variant="danger">
                <Label>退出登录</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </header>
  )
}
