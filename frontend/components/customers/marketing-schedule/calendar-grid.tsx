"use client"

import type { CalendarEvent, CalendarView, EventTemplate } from "./types"

interface CalendarGridProps {
  currentDate: Date
  events: CalendarEvent[]
  view: CalendarView
  onCreateEvent: (date: Date) => void
  onDropTemplate: (date: Date, template: EventTemplate) => void
  onEditEvent: (event: CalendarEvent) => void
}

const WEEK_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const
const WEEKDAY_LABELS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"] as const

function sameDate(left: Date, right: Date) {
  return left.toDateString() === right.toDateString()
}

function renderEventPill(
  event: CalendarEvent,
  isLarge: boolean,
  onEditEvent: (event: CalendarEvent) => void
) {
  return (
    <div
      key={event.id}
      onClick={(mouseEvent) => {
        mouseEvent.stopPropagation()
        onEditEvent(event)
      }}
      className={`${event.color} flex cursor-pointer items-center justify-between rounded-xl border-none text-white shadow-sm hover:brightness-110 ${
        isLarge ? "p-4 text-sm font-bold" : "truncate p-1.5 text-[10px] font-bold"
      }`}
    >
      <span>{event.start} {event.title}</span>
    </div>
  )
}

export function CalendarGrid({
  currentDate,
  events,
  view,
  onCreateEvent,
  onDropTemplate,
  onEditEvent,
}: CalendarGridProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthLastDay = new Date(year, month + 1, 0).getDate()
  const monthFirstDayIndex = new Date(year, month, 1).getDay()

  const weekDays = (() => {
    const start = new Date(currentDate)
    start.setDate(currentDate.getDate() - currentDate.getDay())
    return Array.from({ length: 7 }).map((_, index) => {
      const next = new Date(start)
      next.setDate(start.getDate() + index)
      return next
    })
  })()

  const handleDropTemplate = (event: React.DragEvent<HTMLDivElement>, date: Date) => {
    event.preventDefault()
    event.stopPropagation()
    const raw = event.dataTransfer.getData("template")
    if (!raw) return

    try {
      const template = JSON.parse(raw) as EventTemplate
      onDropTemplate(date, template)
    } catch {
      // 这里静默容错，避免后续替换拖拽协议时影响当前页面交互。
    }
  }

  const eventsByDate = (date: Date) => events.filter((item) => sameDate(item.date, date))
  const today = new Date()

  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      {/* 这里保留局部滚动区，避免和 MainLayout 的主滚动职责冲突。 */}
      <div className="h-full overflow-auto">
        {view === "月" ? (
          <div className="grid min-w-[700px] grid-cols-7">
            {WEEK_LABELS.map((label) => (
              <div
                key={label}
                className="border-b border-slate-50 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-300"
              >
                {label}
              </div>
            ))}
            {Array.from({ length: monthFirstDayIndex }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="h-36 border-b border-r border-slate-50 bg-slate-50/10"
              />
            ))}
            {Array.from({ length: monthLastDay }).map((_, index) => {
              const day = index + 1
              const date = new Date(year, month, day)
              const dayEvents = eventsByDate(date)
              return (
                <div
                  key={day}
                  onClick={() => onCreateEvent(date)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDropTemplate(event, date)}
                  className="h-36 cursor-pointer border-b border-r border-slate-50 p-3 hover:bg-blue-50/20"
                >
                  <span
                    className={`text-xs font-black ${
                      sameDate(date, today)
                        ? "rounded-lg bg-blue-600 px-2.5 py-1 text-white shadow-lg shadow-blue-100"
                        : "text-slate-400"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-2 space-y-1.5">
                    {dayEvents.map((calendarEvent) =>
                      renderEventPill(calendarEvent, false, onEditEvent)
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {view === "周" ? (
          <div className="grid min-h-[600px] min-w-[700px] grid-cols-7">
            {weekDays.map((date, index) => (
              <div
                key={`${date.toDateString()}-${index}`}
                onClick={() => onCreateEvent(date)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDropTemplate(event, date)}
                className="h-full cursor-pointer border-r border-slate-50 p-5 hover:bg-blue-50/10"
              >
                <div className="mb-8 text-center">
                  <div className="text-[10px] font-black uppercase text-slate-300">
                    {WEEK_LABELS[date.getDay()]}
                  </div>
                  <div
                    className={`inline-block h-12 w-12 rounded-2xl text-2xl font-black leading-[48px] ${
                      sameDate(date, today)
                        ? "bg-blue-600 text-white shadow-xl shadow-blue-200"
                        : "text-slate-800"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                </div>
                <div className="space-y-3">
                  {eventsByDate(date).map((calendarEvent) =>
                    renderEventPill(calendarEvent, true, onEditEvent)
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {view === "日" ? (
          <div
            onClick={() => onCreateEvent(currentDate)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDropTemplate(event, currentDate)}
            className="mx-auto h-full max-w-4xl cursor-pointer p-6 md:p-10"
          >
            <div className="mb-10 flex items-center justify-between rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="flex items-center space-x-6">
                <div className="text-6xl font-black leading-none tracking-tighter text-blue-600">
                  {currentDate.getDate()}
                </div>
                <div className="hidden h-12 w-[2px] bg-slate-100 md:block" />
                <div>
                  <div className="text-xl font-black text-slate-800">
                    {WEEKDAY_LABELS[currentDate.getDay()]}
                  </div>
                  <div className="text-sm font-bold text-slate-400">
                    {year}年 {month + 1}月
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {eventsByDate(currentDate).map((calendarEvent) =>
                renderEventPill(calendarEvent, true, onEditEvent)
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
