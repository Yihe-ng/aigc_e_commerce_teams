export type CalendarView = "月" | "周" | "日"

export interface EventTemplate {
  id: string
  title: string
  color: string
}

export interface CalendarEvent {
  id: string
  date: Date
  title: string
  color: string
  start: string
  end: string
  desc?: string
}
