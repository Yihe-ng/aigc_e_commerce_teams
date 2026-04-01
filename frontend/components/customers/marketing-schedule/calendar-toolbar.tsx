"use client"

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import type { CalendarView } from "./types"

interface CalendarToolbarProps {
  currentDate: Date
  view: CalendarView
  onNavigate: (direction: number) => void
  onResetToday: () => void
  onChangeView: (view: CalendarView) => void
  onChangeDate: (next: Date) => void
}

export function CalendarToolbar({
  currentDate,
  view,
  onNavigate,
  onResetToday,
  onChangeView,
  onChangeDate,
}: CalendarToolbarProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const dateValue = `${year}-${String(month + 1).padStart(2, "0")}-${String(
    currentDate.getDate()
  ).padStart(2, "0")}`

  const weekDays = (() => {
    const start = new Date(currentDate)
    start.setDate(currentDate.getDate() - currentDate.getDay())
    return Array.from({ length: 7 }).map((_, index) => {
      const next = new Date(start)
      next.setDate(start.getDate() + index)
      return next
    })
  })()

  const title =
    view === "月"
      ? `${year}年 ${month + 1}月`
      : view === "周"
        ? `${weekDays[0].getMonth() + 1}月${weekDays[0].getDate()}日 - ${
            weekDays[6].getMonth() + 1
          }月${weekDays[6].getDate()}日`
        : `${year}年 ${month + 1}月 ${currentDate.getDate()}日`

  return (
    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate(-1)}
          className="rounded-2xl border border-slate-100 p-2.5 transition-colors hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onNavigate(1)}
          className="rounded-2xl border border-slate-100 p-2.5 transition-colors hover:bg-slate-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onResetToday}
          className="rounded-2xl border border-slate-100 px-4 py-2 text-sm font-black transition-colors hover:bg-slate-100"
        >
          今天
        </button>
      </div>

      <label className="relative flex cursor-pointer items-center rounded-2xl px-4 py-2 transition-colors hover:bg-slate-50">
        <CalendarDays className="mr-2 h-5 w-5 text-blue-600" />
        <span className="text-xl font-black tracking-tight text-slate-800 md:text-2xl">{title}</span>
        {/* 这里保留原生 date input，后续如果要接 HeroUI DatePicker，可直接替换这层。 */}
        <input
          type="date"
          value={dateValue}
          onChange={(event) => {
            const selected = new Date(event.target.value)
            if (!Number.isNaN(selected.getTime())) {
              onChangeDate(selected)
            }
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>

      <div className="flex w-fit rounded-2xl bg-slate-100 p-1.5">
        {(["月", "周", "日"] as CalendarView[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChangeView(option)}
            className={`rounded-xl px-6 py-2 text-sm transition-all ${
              view === option
                ? "bg-white font-black text-blue-600 shadow-md"
                : "text-slate-400"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
