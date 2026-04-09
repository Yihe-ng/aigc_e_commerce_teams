export interface Template { id: string; title: string; color: string; }
export interface CalEvent {
  id: string; date: Date; title: string; color: string;
  start: string; end: string; desc?: string;
}

export const BG   = "#f0efed";
export const CARD = "#ffffff";

export const COLOR_OPTIONS = [
  { name: "主浅蓝", value: "bg-blue-500", dot: "#3b82f6" },
  { name: "天蓝系", value: "bg-sky-400",  dot: "#38bdf8" },
  { name: "浅灰系", value: "bg-slate-300", dot: "#cbd5e1" },
  { name: "青蓝系", value: "bg-cyan-400", dot: "#22d3ee" },
  { name: "极浅蓝", value: "bg-blue-300", dot: "#93c5fd" },
];

export const WEEK      = ["周日","周一","周二","周三","周四","周五","周六"];
export const WEEK_FULL = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}
