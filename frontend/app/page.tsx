"use client";
import React, { useState, useMemo, useRef } from "react";
import { Plus, ChevronLeft, ChevronRight, GripVertical, Trash2, X, Clock, AlignLeft, Palette, Info, Check, CalendarDays, LineChart } from "lucide-react";

/* ─── Types ──────────────────────────────────────────────── */
interface Template { id: string; title: string; color: string }
interface CalEvent {
  id: string; date: Date; title: string; color: string;
  start: string; end: string; desc?: string
}

/* ─── Config (引入高级极简配色变量) ───────────────────────── */
const BG   = "#f0efed";   // 页面底色 / 浅色按钮底色
const CARD = "#ffffff";   // 卡片表面纯白

// 重新设计的浅蓝浅灰天蓝色系选项，替换鲜艳色
const COLOR_OPTIONS = [
  { name: "主浅蓝", value: "bg-blue-500", dot: "#3b82f6" },
  { name: "天蓝系", value: "bg-sky-400",  dot: "#38bdf8" },
  { name: "浅灰系", value: "bg-slate-300", dot: "#cbd5e1" },
  { name: "青蓝系", value: "bg-cyan-400", dot: "#22d3ee" },
  { name: "极浅蓝", value: "bg-blue-300", dot: "#93c5fd" },
];

const WEEK      = ["周日","周一","周二","周三","周四","周五","周六"];
const WEEK_FULL = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];

/* ─── Helpers ────────────────────────────────────────────── */
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

/* ─── Event chip ─────────────────────────────────────────── */
function EventChip({
  ev, large, onClick,
}: { ev: CalEvent; large?: boolean; onClick: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`
        ${ev.color} text-white rounded-md cursor-pointer
        hover:brightness-110 truncate select-none shadow-sm
        ${large ? "px-3 py-2 text-xs mb-1.5" : "px-2 py-1 text-[10px] mb-0.5"}
      `}
    >
      <span className="font-medium">{ev.start}</span>
      <span className="ml-1">{ev.title}</span>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function CalendarPage() {
  const today = new Date();
  const [view, setView]                 = useState<"月"|"周"|"日">("月");
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [showNewTpl, setShowNewTpl]     = useState(false);
  const [newTplTitle, setNewTplTitle]   = useState("");
  const [newTplColor, setNewTplColor]   = useState("bg-blue-500");
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [templates, setTemplates] = useState<Template[]>([
    { id: "t1", title: "团队开会",     color: "bg-slate-300" },
    { id: "t2", title: "发布广告图片", color: "bg-cyan-400"  },
    { id: "t3", title: "数据复盘",     color: "bg-blue-500"  }, 
  ]);

  const [events, setEvents] = useState<CalEvent[]>([
    { id: "e1", date: new Date(2026, 3, 2),  title: "团队开会",     color: "bg-slate-300", start: "10:00", end: "11:30" },
    { id: "e2", date: new Date(2026, 3, 30), title: "团队开会",     color: "bg-slate-300", start: "09:00", end: "10:30" },
  ]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const dateValue = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  const { firstDayIndex, lastDay } = useMemo(() => ({
    lastDay: new Date(year, month + 1, 0).getDate(),
    firstDayIndex: new Date(year, month, 1).getDay()
  }), [year, month]);

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return d;
    });
  }, [currentDate]);

  const handleNav = (dir: number) => {
    const d = new Date(currentDate);
    if (view === "月") d.setMonth(month + dir);
    else if (view === "周") d.setDate(currentDate.getDate() + dir * 7);
    else d.setDate(currentDate.getDate() + dir);
    setCurrentDate(d);
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    setDragOverDate(null);
    try {
      const tpl: Template = JSON.parse(e.dataTransfer.getData("template"));
      setEvents(prev => [...prev, {
        id: Math.random().toString(36).slice(2),
        date, title: tpl.title, color: tpl.color, start: "09:00", end: "10:00",
      }]);
    } catch {}
  };

  const saveEvent = () => {
    if (!editingEvent) return;
    setEvents(prev =>
      prev.find(e => e.id === editingEvent.id)
        ? prev.map(e => e.id === editingEvent.id ? editingEvent : e)
        : [...prev, editingEvent]
    );
    setEditingEvent(null);
    setIsEditModalOpen(false);
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setEditingEvent(null);
    setIsEditModalOpen(false);
  };

  const headerLabel =
    view === "月" ? `${year}年 ${month + 1}月` :
    view === "周" ? `${weekDays[0].getMonth()+1}月${weekDays[0].getDate()}日 — ${weekDays[6].getMonth()+1}月${weekDays[6].getDate()}日` :
                   `${year}年 ${month + 1}月 ${currentDate.getDate()}日`;

  const DayBadge = ({ date, large }: { date: Date; large?: boolean }) => {
    const isToday = sameDay(date, today);
    if (large) return (
      <div className={`w-9 h-9 flex items-center justify-center rounded-full text-base font-semibold
        ${isToday ? "bg-gray-900 text-white" : "text-gray-700"}`}>
        {date.getDate()}
      </div>
    );
    return (
      <span className={`inline-block text-xs font-semibold leading-5 px-1.5 rounded
        ${isToday ? "bg-gray-900 text-white" : "text-gray-400"}`}>
        {date.getDate()}
      </span>
    );
  };

  const Cell = ({
    date, className = "", children,
  }: { date: Date; className?: string; children?: React.ReactNode }) => (
    <div
      onClick={() => {
        setEditingEvent({ id: Math.random().toString(36).slice(2), date: new Date(date), title: "", color: "bg-blue-500", start: "09:00", end: "10:00", desc: "" });
        setIsEditModalOpen(true);
      }}
      onDragOver={e => { e.preventDefault(); setDragOverDate(date.toDateString()); }}
      onDragLeave={() => setDragOverDate(null)}
      onDrop={e => handleDrop(e, date)}
      className={`cursor-pointer transition-colors
        ${dragOverDate === date.toDateString() ? "bg-blue-50/40" : "hover:bg-[#f7f6f4]"}
        ${className}`}
    >
      {children}
    </div>
  );

  return (
    <div className="min-h-full space-y-4" style={{ background: BG, margin: "-1.5rem", padding: "1.5rem" }}>
      
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">营销日程规划</h1>
        <p className="text-sm text-gray-500 mt-1">管理您的内容发布节奏，拖拽模板快速安排营销计划。</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-start">

        <aside className="w-full xl:w-56 shrink-0 space-y-4">
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: CARD }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-gray-800">可选事件模板</h3>
              <button
                onClick={() => { setNewTplTitle(""); setNewTplColor("bg-blue-500"); setShowNewTpl(true); }}
                className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 transition-colors"
                style={{ background: BG }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">拖拽到日历格子中快速添加事件</p>
            <div className="space-y-2">
              {templates.map(t => (
                <div key={t.id} draggable
                  onDragStart={e => e.dataTransfer.setData("template", JSON.stringify(t))}
                  className={`${t.color} text-white rounded-xl px-3 py-2.5 cursor-grab flex items-center justify-between group hover:brightness-105 active:scale-[0.98] select-none transition-all`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GripVertical className="w-3.5 h-3.5 shrink-0 opacity-40" />
                    <span className="text-sm font-medium truncate">{t.title}</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setTemplates(p => p.filter(x => x.id !== t.id)); }}
                    className="shrink-0 ml-1 opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity"
                  ><X className="w-3 h-3" /></button>
                </div>
              ))}
              {templates.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-5">暂无模板，点击 + 添加</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-5 shadow-sm" style={{ background: CARD }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">日程概览</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "本月日程", value: events.filter(e => e.date.getFullYear() === year && e.date.getMonth() === month).length },
                { label: "事件模板", value: templates.length },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: BG }}>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 rounded-2xl flex flex-col overflow-hidden shadow-sm" style={{ background: CARD }}>
          <div
            className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2"
            style={{ background: "#fafaf8" }}
          >
            <div className="flex items-center gap-1">
              <button onClick={() => handleNav(-1)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                style={{ background: BG }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => handleNav(1)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                style={{ background: BG }}>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-600 ml-1 transition-colors hover:opacity-80"
                style={{ background: BG }}>
                今天
              </button>
            </div>

            <div
              onClick={() => dateInputRef.current?.showPicker()}
              className="relative flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg hover:opacity-80 transition-all"
            >
              <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{headerLabel}</span>
              <input ref={dateInputRef} type="date" value={dateValue}
                onChange={e => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) setCurrentDate(d); }}
                className="absolute inset-0 opacity-0 -z-10 w-full h-full" />
            </div>

            <div className="flex rounded-lg overflow-hidden p-0.5" style={{ background: BG }}>
              {(["月","周","日"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3.5 py-1 text-xs font-semibold transition-all ${view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}
                >{v}</button>
              ))}
            </div>
          </div>

          {view === "月" && (
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-7 min-w-[640px]">
                {WEEK.map(d => (
                  <div key={d}
                    className="py-2.5 text-center text-[11px] font-semibold text-gray-400 border-b border-gray-100 tracking-wide"
                    style={{ background: "#fafaf8" }}>
                    {d}
                  </div>
                ))}
                {Array.from({ length: firstDayIndex }, (_, i) => (
                  <div key={`b-${i}`} className="h-28 border-r border-b border-gray-100" style={{ background: "#f7f6f4" }} />
                ))}
                {Array.from({ length: lastDay }, (_, i) => {
                  const date = new Date(year, month, i + 1);
                  return (
                    <Cell key={i} date={date} className="h-28 border-r border-b border-gray-100 bg-white p-2">
                      <DayBadge date={date} />
                      <div className="mt-1">
                        {events.filter(e => sameDay(e.date, date)).map(ev => (
                          <EventChip key={ev.id} ev={ev} onClick={() => {setEditingEvent({ ...ev }); setIsEditModalOpen(true);}} />
                        ))}
                      </div>
                    </Cell>
                  );
                })}
              </div>
            </div>
          )}

          {view === "周" && (
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-7 min-w-[640px] min-h-[520px]">
                {weekDays.map((date, i) => (
                  <Cell key={i} date={date} className="border-r border-gray-100 bg-white p-3 h-full">
                    <div className="flex flex-col items-center gap-1 mb-4">
                      <span className="text-[10px] font-semibold text-gray-400 tracking-wide">{WEEK[date.getDay()]}</span>
                      <DayBadge date={date} large />
                    </div>
                    {events.filter(e => sameDay(e.date, date)).map(ev => (
                      <EventChip key={ev.id} ev={ev} large onClick={() => {setEditingEvent({ ...ev }); setIsEditModalOpen(true);}} />
                    ))}
                  </Cell>
                ))}
              </div>
            </div>
          )}

          {view === "日" && (
            <div
              className="flex-1 p-6 cursor-pointer bg-white"
              onClick={() => {
                setEditingEvent({ id: Math.random().toString(36).slice(2), date: new Date(currentDate), title: "", color: "bg-blue-500", start: "09:00", end: "10:00", desc: "" });
                setIsEditModalOpen(true);
              }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, currentDate)}
            >
              <div className="flex items-center gap-5 rounded-xl p-5 mb-6" style={{ background: BG }}>
                <div className="text-4xl font-bold text-gray-900 leading-none w-14 text-center">{currentDate.getDate()}</div>
                <div className="h-10 w-px bg-gray-300" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{WEEK_FULL[currentDate.getDay()]}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{year}年 {month + 1}月</p>
                </div>
              </div>
              <div className="space-y-1.5 max-w-xl">
                {events.filter(e => sameDay(e.date, currentDate)).map(ev => (
                  <EventChip key={ev.id} ev={ev} large onClick={() => {setEditingEvent({ ...ev }); setIsEditModalOpen(true);}} />
                ))}
                {events.filter(e => sameDay(e.date, currentDate)).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">今天暂无日程，点击此处或从左侧拖入模板</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 弹窗区域 */}
      {(isEditModalOpen || showNewTpl) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.18)" }}
          onClick={e => { if (e.target === e.currentTarget) { setEditingEvent(null); setIsEditModalOpen(false); setShowNewTpl(false); } }}
        >
          <div className="rounded-2xl w-full max-w-sm shadow-2xl" style={{ background: CARD }}>

            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                {showNewTpl ? "新建事件模板" : "日程详情"}
              </h3>
              <button
                onClick={() => { setEditingEvent(null); setIsEditModalOpen(false); setShowNewTpl(false); }}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 transition-colors" style={{ background: BG }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">任务名称</label>
                <input
                  autoFocus
                  value={showNewTpl ? newTplTitle : (editingEvent?.title ?? "")}
                  onChange={e =>
                    showNewTpl
                      ? setNewTplTitle(e.target.value)
                      : setEditingEvent(ev => ev ? { ...ev, title: e.target.value } : ev)
                  }
                  placeholder="输入任务名称..."
                  className="w-full rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all border-0"
                  style={{ background: BG }}
                />
              </div>

              {!showNewTpl && editingEvent && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-1.5">
                    <Clock className="w-3.5 h-3.5" />时间段
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="time" value={editingEvent.start}
                      onChange={e => setEditingEvent(ev => ev ? { ...ev, start: e.target.value } : ev)}
                      className="rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 border-0"
                      style={{ background: BG }}
                    />
                    <input type="time" value={editingEvent.end}
                      onChange={e => setEditingEvent(ev => ev ? { ...ev, end: e.target.value } : ev)}
                      className="rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 border-0"
                      style={{ background: BG }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">颜色标签</label>
                <div className="flex gap-2.5 flex-wrap">
                  {COLOR_OPTIONS.map(c => {
                    const active = showNewTpl ? newTplColor === c.value : editingEvent?.color === c.value;
                    return (
                      <button
                        key={c.value}
                        onClick={() =>
                          showNewTpl
                            ? setNewTplColor(c.value)
                            : setEditingEvent(ev => ev ? { ...ev, color: c.value } : ev)
                        }
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all
                          ${active ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
                        style={{ background: c.dot }}
                      >
                        {active && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-2 items-center">
              {!showNewTpl && editingEvent && events.find(e => e.id === editingEvent.id) && (
                <button
                  onClick={() => deleteEvent(editingEvent.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 transition-colors" style={{ background: BG }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => { setEditingEvent(null); setIsEditModalOpen(false); setShowNewTpl(false); }}
                className="flex-1 py-2 text-sm font-medium text-gray-600 rounded-lg transition-colors" style={{ background: BG }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (showNewTpl) {
                    if (newTplTitle.trim())
                      setTemplates(p => [...p, { id: Date.now().toString(), title: newTplTitle.trim(), color: newTplColor }]);
                    setShowNewTpl(false);
                  } else {
                    saveEvent();
                  }
                }}
                className="flex-[2] py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {showNewTpl ? "创建模板" : "保存日程"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
