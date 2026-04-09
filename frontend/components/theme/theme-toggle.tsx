"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  /** 在 mounted 之前不要用 resolvedTheme，否则客户端可能比 SSR 更早读到 localStorage，导致 hydration 不匹配 */
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        "h-10 w-10 shrink-0 rounded-full border-border/60 bg-background/80 text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-accent",
        "dark:border-slate-600 dark:bg-slate-800/90 dark:hover:bg-slate-700",
        className,
      )}
      aria-label={
        mounted ? (isDark ? "切换到日间模式" : "切换到夜间模式") : "切换主题"
      }
      aria-pressed={mounted ? isDark : false}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {!mounted ? (
        <span className="size-5 animate-pulse rounded-full bg-muted" aria-hidden />
      ) : isDark ? (
        <Sun className="size-5 text-amber-300" aria-hidden />
      ) : (
        <Moon className="size-5 text-slate-600" aria-hidden />
      )}
    </Button>
  )
}
