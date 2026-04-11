"use client"

import { useMemo } from "react"
import type { CalendarEvent, CalendarView, EventTemplate } from "./types"
import { sameDay, WEEK, WEEK_FULL } from "./types"

interface CalendarGridProps {
  currentDate: Date
  events: CalendarEvent[]
  view: CalendarView
  dragOverDate: string | null
  onDragOverDateChange: (date: string | null) => void
  onCreateEvent: (date: Date) => void
  onDropTemplate: (date: Date, template: EventTemplate) => void
  onEditEvent: (event: CalendarEvent) => void
}

// 事件卡片组件
function EventChip({
  ev,
  large,
  onClick,
}: {
  ev: CalendarEvent
  large?: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`
        group flex items-center gap-1.5 cursor-pointer
        hover:bg-gray-50 rounded-md transition-all duration-150
        ${large ? "px-2 py-2 mb-1.5" : "px-1.5 py-1 mb-1"}
      `}
    >
      {/* 颜色指示器 */}
      <div className={`${ev.color} rounded-full shrink-0 shadow-sm ${large ? "w-2.5 h-2.5" : "w-2 h-2"}`} />
      {/* 时间 */}
      <span className={`font-medium text-gray-500 shrink-0 ${large ? "text-xs" : "text-[10px]"}`}>
        {ev.start}
      </span>
      {/* 标题 */}
      <span className={`text-gray-700 truncate ${large ? "text-xs" : "text-[10px]"}`}>
        {ev.title}
      </span>
    </div>
  )
}

// 日期徽章组件
function DayBadge({ date, large }: { date: Date; large?: boolean }) {
  const today = new Date()
  const isToday = sameDay(date, today)

  if (large) {
    return (
      <div
        className={`w-9 h-9 flex items-center justify-center rounded-full text-base font-semibold
        ${isToday ? "bg-gray-900 text-white" : "text-gray-700"}`}
      >
        {date.getDate()}
      </div>
    )
  }

  return (
    <span
      className={`inline-block text-xs font-semibold leading-5 px-1.5 rounded
        ${isToday ? "bg-gray-900 text-white" : "text-gray-400"}`}
    >
      {date.getDate()}
    </span>
  )
}

export function CalendarGrid({
  currentDate,
  events,
  view,
  dragOverDate,
  onDragOverDateChange,
  onCreateEvent,
  onDropTemplate,
  onEditEvent,
}: CalendarGridProps) {
  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 月视图计算
  const { firstDayIndex, lastDay } = useMemo(() => ({
    lastDay: new Date(year, month + 1, 0).getDate(),
    firstDayIndex: new Date(year, month, 1).getDay(),
  }), [year, month])

  // 周视图计算
  const weekDays = useMemo(() => {
    const start = new Date(currentDate)
    start.setDate(currentDate.getDate() - currentDate.getDay())
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [currentDate])

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault()
    onDragOverDateChange(dateStr)
  }

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    onDragOverDateChange(null)
    try {
      const tpl: EventTemplate = JSON.parse(e.dataTransfer.getData("template"))
      onDropTemplate(date, tpl)
    } catch {}
  }

  // 单元格组件
  const Cell = ({
    date,
    className = "",
    children,
  }: {
    date: Date
    className?: string
    children?: React.ReactNode
  }) => {
    const isDragOver = dragOverDate === date.toDateString()
    return (
      <div
        onClick={() => onCreateEvent(date)}
        onDragOver={(e) => handleDragOver(e, date.toDateString())}
        onDragLeave={() => onDragOverDateChange(null)}
        onDrop={(e) => handleDrop(e, date)}
        className={`cursor-pointer transition-all duration-200 relative
          ${isDragOver ? "bg-blue-50/60 ring-2 ring-inset ring-blue-300" : "hover:bg-[#f7f6f4]"}
          ${className}`}
      >
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              松开以创建日程
            </div>
          </div>
        )}
        <div className={`transition-opacity ${isDragOver ? "opacity-30" : "opacity-100"}`}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 月视图 */}
      {view === "月" && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 min-w-[640px]">
            {WEEK.map((d) => (
              <div
                key={d}
                className="py-2.5 text-center text-[11px] font-semibold text-gray-400 border-b border-gray-100 tracking-wide bg-[#FAFAFA]"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayIndex }, (_, i) => (
              <div
                key={`b-${i}`}
                className="h-28 border-r border-b border-gray-100 bg-[#F5F5F5]"
              />
            ))}
            {Array.from({ length: lastDay }, (_, i) => {
              const date = new Date(year, month, i + 1)
              const dayEvents = events.filter((e) => sameDay(e.date, date))
              return (
                <Cell
                  key={i}
                  date={date}
                  className="h-28 border-r border-b border-gray-100 bg-white p-2"
                >
                  <DayBadge date={date} />
                  <div className="mt-1">
                    {dayEvents.map((ev) => (
                      <EventChip
                        key={ev.id}
                        ev={ev}
                        onClick={() => onEditEvent(ev)}
                      />
                    ))}
                    {dayEvents.length === 0 && (
                      <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-gray-300">点击添加</span>
                      </div>
                    )}
                  </div>
                </Cell>
              )
            })}
          </div>
        </div>
      )}

      {/* 周视图 */}
      {view === "周" && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 min-w-[640px] min-h-[520px]">
            {weekDays.map((date, i) => {
              const dayEvents = events.filter((e) => sameDay(e.date, date))
              return (
                <Cell
                  key={i}
                  date={date}
                  className="border-r border-gray-100 bg-white p-3 h-full"
                >
                  <div className="flex flex-col items-center gap-1 mb-4">
                    <span className="text-[10px] font-semibold text-gray-400 tracking-wide">
                      {WEEK[date.getDay()]}
                    </span>
                    <DayBadge date={date} large />
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((ev) => (
                      <EventChip
                        key={ev.id}
                        ev={ev}
                        large
                        onClick={() => onEditEvent(ev)}
                      />
                    ))}
                    {dayEvents.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                        <span className="text-xs">暂无日程</span>
                        <span className="text-[10px] mt-0.5">点击添加</span>
                      </div>
                    )}
                  </div>
                </Cell>
              )
            })}
          </div>
        </div>
      )}

      {/* 日视图 */}
      {view === "日" && (
        <div
          className="flex-1 p-6 cursor-pointer bg-white"
          onClick={() => onCreateEvent(currentDate)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, currentDate)}
        >
          <div
            className="flex items-center gap-5 rounded-2xl p-5 mb-6 bg-[#F8F8F8]"
          >
            <div className="text-4xl font-bold text-gray-900 leading-none w-14 text-center">
              {currentDate.getDate()}
            </div>
            <div className="h-10 w-px bg-gray-300" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {WEEK_FULL[currentDate.getDay()]}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {year}年 {month + 1}月
              </p>
            </div>
          </div>
          <div className="space-y-1.5 max-w-xl">
            {events
              .filter((e) => sameDay(e.date, currentDate))
              .map((ev) => (
                <EventChip
                  key={ev.id}
                  ev={ev}
                  large
                  onClick={() => onEditEvent(ev)}
                />
              ))}
            {events.filter((e) => sameDay(e.date, currentDate)).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                今天暂无日程，点击此处或从左侧拖入模板
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
