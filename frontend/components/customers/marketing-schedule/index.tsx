"use client";
import React, { useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, Check, Trash2, X, CalendarDays } from "lucide-react";
import { Template, CalEvent, BG, CARD, COLOR_OPTIONS, WEEK, WEEK_FULL, sameDay } from "./types";
import EventChip from "./EventChip";
import Sidebar from "./Sidebar";

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
        {/* 拆分后的组件应用 */}
        <Sidebar 
          templates={templates} 
          setTemplates={setTemplates} 
          events={events} 
          year={year} 
          month={month} 
          onAddTemplate={() => { setNewTplTitle(""); setNewTplColor("bg-blue-500"); setShowNewTpl(true); }} 
        />

        <div className="flex-1 min-w-0 rounded-2xl flex flex-col overflow-hidden shadow-sm" style={{ background: CARD }}>
          {/* 工具栏 */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2" style={{ background: "#fafaf8" }}>
            <div className="flex items-center gap-1">
              <button onClick={() => handleNav(-1)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 transition-colors" style={{ background: BG }}><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => handleNav(1)} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 transition-colors" style={{ background: BG }}><ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-600 ml-1 transition-colors hover:opacity-80" style={{ background: BG }}>今天</button>
            </div>
            <div onClick={() => dateInputRef.current?.showPicker()} className="relative flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg hover:opacity-80 transition-all">
              <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{headerLabel}</span>
              <input ref={dateInputRef} type="date" value={dateValue} onChange={e => { const d = new Date(e.target.value); if (!isNaN(d.getTime())) setCurrentDate(d); }} className="absolute inset-0 opacity-0 -z-10 w-full h-full" />
            </div>
            <div className="flex rounded-lg overflow-hidden p-0.5" style={{ background: BG }}>
              {(["月","周","日"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-3.5 py-1 text-xs font-semibold transition-all ${view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}>{v}</button>
              ))}
            </div>
          </div>

          {/* 月视图 */}
          {view === "月" && (
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-7 min-w-[640px]">
                {WEEK.map(d => (
                  <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-gray-400 border-b border-gray-100 tracking-wide" style={{ background: "#fafaf8" }}>{d}</div>
                ))}
                {Array.from({ length: firstDayIndex }, (_, i) => <div key={`b-${i}`} className="h-28 border-r border-b border-gray-100" style={{ background: "#f7f6f4" }} />)}
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

          {/* 周视图 */}
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

          {/* 日视图 */}
          {view === "日" && (
            <div className="flex-1 p-6 cursor-pointer bg-white" onClick={() => { setEditingEvent({ id: Math.random().toString(36).slice(2), date: new Date(currentDate), title: "", color: "bg-blue-500", start: "09:00", end: "10:00", desc: "" }); setIsEditModalOpen(true); }} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, currentDate)}>
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
                {events.filter(e => sameDay(e.date, currentDate)).length === 0 && <p className="text-sm text-gray-400 text-center py-8">今天暂无日程，点击此处或从左侧拖入模板</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 弹窗区域 */}
      {(isEditModalOpen || showNewTpl) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.18)" }} onClick={e => { if (e.target === e.currentTarget) { setEditingEvent(null); setIsEditModalOpen(false); setShowNewTpl(false); } }}>
          <div className="rounded-2xl w-full max-w-sm shadow-2xl" style={{ background: CARD }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">{showNewTpl ? "新建事件模板" : "日程详情"}</h3>
              <button onClick={() => { setEditingEvent(null); setIsEditModalOpen(false); setShowNewTpl(false); }} className="p-1 rounded-md text-gray-400 hover:text-gray-600 transition-colors" style={{ background: BG }}><X className="w-4 h-4" /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1.5">任务名称</label>
                <input autoFocus value={showNewTpl ? newTplTitle : (editingEvent?.title ?? "")} onChange={e => showNewTpl ? setNewTplTitle(e.target.value) : setEditingEvent(ev => ev ? { ...ev, title: e.target.value } : ev)} placeholder="输入任务名称..." className="w-full rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all border-0" style={{ background: BG }} />
              </div>
              {!showNewTpl && editingEvent && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-1.5"><Clock className="w-3.5 h-3.5" />时间段</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="time" value={editingEvent.start} onChange={e => setEditingEvent(ev => ev ? { ...ev, start: e.target.value } : ev)} className="rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 border-0" style={{ background: BG }} />
                    <input type="time" value={editingEvent.end} onChange={e => setEditingEvent(ev => ev ? { ...ev, end: e.target.value } : ev)} className="rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 border-0" style={{ background: BG }} />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">颜色标签</label>
                <div className="flex gap-2.5 flex-wrap">
                  {COLOR_OPTIONS.map(c => {
                    const active = showNewTpl ? newTplColor === c.value : editingEvent?.color === c.value;
                    return (
                      <button key={c.value} onClick={() => showNewTpl ? setNewTplColor(c.value) : setEditingEvent(ev => ev ? { ...ev, color: c.value } : ev)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${active ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`} style={{ background: c.dot }}>
                        {active && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2 items-center">
              {!showNewTpl && editingEvent && events.find(e => e.id === editingEvent.id) && (
                <button onClick={() => deleteEvent(editingEvent.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-500 transition-colors" style={{ background: BG }}><Trash2 className="w-4 h-4" /></button>
              )}
              <button onClick={() => { setEditingEvent(null); setIsEditModalOpen(false); setShowNewTpl(false); }} className="flex-1 py-2 text-sm font-medium text-gray-600 rounded-lg transition-colors" style={{ background: BG }}>取消</button>
              <button onClick={() => { if (showNewTpl) { if (newTplTitle.trim()) setTemplates(p => [...p, { id: Date.now().toString(), title: newTplTitle.trim(), color: newTplColor }]); setShowNewTpl(false); } else { saveEvent(); } }} className="flex-[2] py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors">
                {showNewTpl ? "创建模板" : "保存日程"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
