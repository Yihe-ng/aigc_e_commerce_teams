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

export interface ColorOption {
  name: string
  value: string
  dot: string
}

// 重新设计的浅蓝浅灰天蓝色系选项，替换鲜艳色
export const COLOR_OPTIONS: ColorOption[] = [
  { name: "主浅蓝", value: "bg-blue-500", dot: "#3b82f6" },
  { name: "天蓝系", value: "bg-sky-400", dot: "#38bdf8" },
  { name: "浅灰系", value: "bg-slate-300", dot: "#cbd5e1" },
  { name: "青蓝系", value: "bg-cyan-400", dot: "#22d3ee" },
  { name: "极浅蓝", value: "bg-blue-300", dot: "#93c5fd" },
]

export const WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
export const WEEK_FULL = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]

// 页面配色配置
export const PAGE_COLORS = {
  BG: "#f0efed",   // 页面底色 / 浅色按钮底色
  CARD: "#ffffff", // 卡片表面纯白
  HEADER_BG: "#fafaf8", // 头部背景
  CELL_HOVER: "#f7f6f4", // 单元格悬停色
  DRAG_OVER: "bg-blue-50/40", // 拖拽悬停色
}

// 辅助函数
export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function createDraftEvent(date: Date): CalendarEvent {
  return {
    id: Math.random().toString(36).slice(2),
    date: new Date(date),
    title: "",
    color: "bg-blue-500",
    start: "09:00",
    end: "10:00",
    desc: "",
  }
}
