"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FileText, Save, ShoppingCart, Wand2 } from "lucide-react"

const MODES = [
  { id: "marketing", label: "营销文案生成", icon: Wand2 },
  { id: "guide", label: "导购文案生成", icon: ShoppingCart },
  { id: "product", label: "产品信息录入", icon: FileText },
  { id: "save", label: "最佳方案保存", icon: Save },
] as const

type ModeType = (typeof MODES)[number]["id"]

interface ModeSwitcherProps {
  activeMode: ModeType
  onModeChange: (mode: ModeType) => void
}

interface IndicatorStyle {
  width: number
  left: number
}

export function ModeSwitcher({ activeMode, onModeChange }: ModeSwitcherProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
    width: 0,
    left: 0,
  })

  const activeIndex = useMemo(
    () => MODES.findIndex((m) => m.id === activeMode),
    [activeMode]
  )

  const calculateIndicatorPosition = useCallback(() => {
    const activeTab = tabRefs.current[activeIndex]
    const container = containerRef.current

    if (activeTab && container) {
      const containerRect = container.getBoundingClientRect()
      const tabRect = activeTab.getBoundingClientRect()

      setIndicatorStyle({
        width: tabRect.width,
        left: tabRect.left - containerRect.left,
      })
    }
  }, [activeIndex])

  useEffect(() => {
    const frame = requestAnimationFrame(calculateIndicatorPosition)
    return () => cancelAnimationFrame(frame)
  }, [calculateIndicatorPosition])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(calculateIndicatorPosition)
    observer.observe(container)
    window.addEventListener("resize", calculateIndicatorPosition)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", calculateIndicatorPosition)
    }
  }, [calculateIndicatorPosition])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      let newIndex = currentIndex

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        newIndex = currentIndex > 0 ? currentIndex - 1 : MODES.length - 1
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        newIndex = currentIndex < MODES.length - 1 ? currentIndex + 1 : 0
      } else if (e.key === "Home") {
        e.preventDefault()
        newIndex = 0
      } else if (e.key === "End") {
        e.preventDefault()
        newIndex = MODES.length - 1
      } else {
        return
      }

      onModeChange(MODES[newIndex].id as ModeType)
      tabRefs.current[newIndex]?.focus()
    },
    [onModeChange]
  )

  const handleTabClick = useCallback(
    (mode: ModeType) => onModeChange(mode),
    [onModeChange]
  )

  return (
    <div className="flex justify-center px-1 py-0.5">
      <div
        ref={containerRef}
        role="tablist"
        aria-label="文案生成模式选择"
        className="relative inline-flex bg-slate-100 rounded-full p-1 gap-1"
      >
        <div
          className="absolute top-1 bottom-1 bg-[#91C1FA] rounded-full shadow-sm transition-all duration-300 ease-out"
          style={{
            width: `${indicatorStyle.width}px`,
            transform: `translateX(${indicatorStyle.left}px)`,
          }}
          aria-hidden="true"
        />

        {MODES.map((mode, index) => {
          const Icon = mode.icon
          const isActive = activeMode === mode.id

          return (
            <button
              key={mode.id}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={mode.label}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(mode.id as ModeType)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                relative z-10 flex items-center justify-center
                px-3 md:px-5 py-2.5 rounded-full
                text-sm font-medium
                transition-colors duration-200 ease-out
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#91C1FA] focus-visible:ring-offset-1
                ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <Icon className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{mode.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
