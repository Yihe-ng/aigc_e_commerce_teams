"use client"

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import type { CalendarView } from "./types"
import { WEEK } from "./types"

interface CalendarToolbarProps {
  currentDate: Date
  view: CalendarView
  dateInputRef: React.RefObject<HTMLInputElement | null>
  onNavigate: (direction: number) => void
  onResetToday: () => void
  onChangeView: (view: CalendarView) => void
  onChangeDate: (date: Date) => void
}

export function CalendarToolbar({
  currentDate,
  view,
  dateInputRef,
  onNavigate,
  onResetToday,
  onChangeView,
  onChangeDate,
}: CalendarToolbarProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 计算周视图日期范围
  const getWeekRange = () => {
    const start = new Date(currentDate)
    start.setDate(currentDate.getDate() - currentDate.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start, end }
  }

  const weekRange = getWeekRange()

  const headerLabel =
    view === "月"
      ? `${year}年 ${month + 1}月`
      : view === "周"
      ? `${weekRange.start.getMonth() + 1}月${weekRange.start.getDate()}日 — ${weekRange.end.getMonth() + 1}月${weekRange.end.getDate()}日`
      : `${year}年 ${month + 1}月 ${currentDate.getDate()}日`

  const dateValue = `${year}-${String(month + 1).padStart(2, "0")}-${String(
    currentDate.getDate()
  ).padStart(2, "0")}`

  return (
    <div
      className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 bg-white"
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => onNavigate(-1)}
          className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 transition-colors bg-[#F8F8F8]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onNavigate(1)}
          className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 transition-colors bg-[#F8F8F8]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onResetToday}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl text-gray-600 ml-1 transition-colors hover:opacity-80 bg-[#F8F8F8]"
        >
          今天
        </button>
      </div>

      <div
        onClick={() => dateInputRef.current?.showPicker()}
        className="relative flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl hover:opacity-80 transition-all"
      >
        <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
          {headerLabel}
        </span>
        <input
          ref={dateInputRef}
          type="date"
          value={dateValue}
          onChange={(e) => {
            const d = new Date(e.target.value)
            if (!isNaN(d.getTime())) onChangeDate(d)
          }}
          className="absolute inset-0 opacity-0 -z-10 w-full h-full"
        />
      </div>

      <div
        className="flex rounded-xl overflow-hidden p-0.5 bg-[#F8F8F8]"
      >
        {(["月", "周", "日"] as const).map((v) => (
          <button
            key={v}
            onClick={() => onChangeView(v)}
            className={`px-3.5 py-1 text-xs font-semibold transition-all ${
              view === v
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}
