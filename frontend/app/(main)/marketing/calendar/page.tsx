"use client";
import React, { useState, useMemo, useRef } from "react";
import { Plus, ChevronLeft, ChevronRight, GripVertical, Trash2, X, Clock, AlignLeft, Palette, Info, Check, CalendarDays } from "lucide-react";
import PageContainer from "@/components/layout/page-container";

export default function CalendarPage() {
  const [view, setView] = useState("月"); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const colorOptions = [
    { name: "经典蓝", value: "bg-blue-600" },
    { name: "品牌紫", value: "bg-purple-600" },
    { name: "紧急红", value: "bg-red-500" },
    { name: "活力橙", value: "bg-orange-500" },
    { name: "库存绿", value: "bg-emerald-500" },
    { name: "秒杀黄", value: "bg-amber-400" },
    { name: "营销粉", value: "bg-rose-500" },
  ];

  const [templates, setTemplates] = useState([
    { id: 't1', title: "团队开会", color: "bg-purple-600" },
    { id: 't2', title: "发布广告图片", color: "bg-sky-500" },
    { id: 't5', title: "666", color: "bg-blue-600" },
  ]);

  const [events, setEvents] = useState([
    { id: '1', date: new Date(2026, 2, 2), title: "团队开会", color: "bg-purple-600", start: "10:01", end: "11:30", desc: "" },
    { id: '2', date: new Date(2026, 2, 30), title: "团队开会", color: "bg-purple-600", start: "09:00", end: "10:30", desc: "" },
  ]);

  const [newTplTitle, setNewTplTitle] = useState("");
  const [newTplColor, setNewTplColor] = useState("bg-blue-600");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const dateValue = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  const monthInfo = useMemo(() => ({
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

  const handleCellClick = (date: Date) => {
    setEditingEvent({ id: Math.random().toString(36), date: new Date(date), title: "", color: "bg-blue-600", start: "09:00", end: "10:00", desc: "" });
    setIsEditModalOpen(true);
  };

  const renderEvents = (date: Date, isLarge = false) => {
    return events.filter(e => e.date.toDateString() === date.toDateString()).map(ev => (
      <div key={ev.id} onClick={(e) => {e.stopPropagation(); setEditingEvent(ev); setIsEditModalOpen(true);}} 
           className={`${ev.color} text-white ${isLarge ? 'p-4 text-sm' : 'p-1.5 text-[10px]'} rounded-xl font-bold flex justify-between items-center cursor-pointer hover:brightness-110 shadow-sm truncate border-none`}>
        <span>{ev.start} {ev.title}</span>
      </div>
    ));
  };

  return (
    <PageContainer>
      <div className="flex flex-col xl:flex-row gap-6 h-full bg-slate-50 p-6 rounded-[40px] min-h-[85vh]">
        <div className="w-full xl:w-72 space-y-6">
          <div className="bg-white p-7 rounded-[32px] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-800 italic flex items-center"><Plus className="w-4 h-4 mr-1 text-blue-600" /> 可选择事件</h3>
              <button onClick={() => setIsNewTemplateModalOpen(true)} className="p-1.5 text-blue-600"><Plus/></button>
            </div>
            <div className="space-y-2.5">
              {templates.map(t => (
                <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("template", JSON.stringify(t))}
                     className={`${t.color} text-white p-3.5 rounded-2xl shadow-sm cursor-grab flex items-center justify-between group transition-all`}>
                  <div className="flex items-center"><GripVertical className="w-4 h-4 mr-2 opacity-40"/><span className="text-xs font-black">{t.title}</span></div>
                  <button onClick={() => setTemplates(templates.filter(tmp => tmp.id !== t.id))} className="opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[40px] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-7 border-b border-gray-50 flex items-center justify-between relative">
            <div className="flex items-center space-x-3">
              <button onClick={() => handleNav(-1)} className="p-2.5 hover:bg-slate-100 rounded-2xl border border-slate-100"><ChevronLeft className="w-4 h-4"/></button>
              <button onClick={() => handleNav(1)} className="p-2.5 hover:bg-slate-100 rounded-2xl border border-slate-100"><ChevronRight className="w-4 h-4"/></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2 hover:bg-slate-100 rounded-2xl border border-slate-100 text-sm font-black ml-2">今天</button>
            </div>
            
            <div onClick={() => dateInputRef.current?.showPicker()} className="flex items-center cursor-pointer hover:bg-slate-50 px-4 py-2 rounded-2xl transition-all relative">
              <CalendarDays className="w-5 h-5 mr-2 text-blue-600" />
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter">
                {view === "月" ? `${year}年 ${month + 1}月` : view === "周" ? `${weekDays[0].getMonth()+1}月${weekDays[0].getDate()}日 - ${weekDays[6].getMonth()+1}月${weekDays[6].getDate()}日` : `${year}年 ${currentDate.getMonth()+1}月 ${currentDate.getDate()}日`}
              </h2>
              <input ref={dateInputRef} type="date" value={dateValue} onChange={(e) => { const selected = new Date(e.target.value); if(!isNaN(selected.getTime())) setCurrentDate(selected); }} className="absolute inset-0 w-full h-full opacity-0 -z-10" />
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {['月', '周', '日'].map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-6 py-2 rounded-xl text-sm transition-all ${view === v ? 'bg-white shadow-md font-black text-blue-600' : 'text-slate-400'}`}>{v}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {view === "月" && (
              <div className="grid grid-cols-7 h-full min-w-[700px]">
                {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(d => ( <div key={d} className="py-4 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">{d}</div> ))}
                {Array.from({ length: monthInfo.firstDayIndex }).map((_, i) => ( <div key={`e-${i}`} className="h-36 border-r border-b border-slate-50 bg-slate-50/10" /> ))}
                {Array.from({ length: monthInfo.lastDay }).map((_, i) => {
                  const day = i + 1; const date = new Date(year, month, day);
                  return (
                    <div key={day} onClick={() => handleCellClick(date)} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=> { e.preventDefault(); e.stopPropagation(); const tpl = JSON.parse(e.dataTransfer.getData("template")); setEvents([...events, { id: Math.random().toString(36), date, title: tpl.title, color: tpl.color, start: "09:00", end: "10:00" }]); }} className="h-36 p-3 border-r border-b border-slate-50 hover:bg-blue-50/20 cursor-pointer">
                      <span className={`text-xs font-black ${date.toDateString() === new Date().toDateString() ? 'text-white bg-blue-600 px-2.5 py-1 rounded-lg shadow-lg shadow-blue-100' : 'text-slate-400'}`}>{day}</span>
                      <div className="mt-2 space-y-1.5">{renderEvents(date)}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {view === "周" && (
              <div className="grid grid-cols-7 h-full min-h-[600px] min-w-[700px]">
                {weekDays.map((date, i) => (
                  <div key={i} onClick={() => handleCellClick(date)} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{ e.preventDefault(); e.stopPropagation(); const tpl = JSON.parse(e.dataTransfer.getData("template")); setEvents([...events, { id: Math.random().toString(36), date, title: tpl.title, color: tpl.color, start: "09:00", end: "10:00" }]); }} className="border-r border-slate-50 p-5 hover:bg-blue-50/10 cursor-pointer h-full">
                    <div className="text-center mb-8">
                      <div className="text-[10px] font-black text-slate-300 uppercase">{['周日','周一','周二','周三','周四','周五','周六'][date.getDay()]}</div>
                      <div className={`text-2xl font-black inline-block w-12 h-12 leading-[48px] rounded-2xl ${date.toDateString() === new Date().toDateString() ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'text-slate-800'}`}>{date.getDate()}</div>
                    </div>
                    <div className="space-y-3">{renderEvents(date, true)}</div>
                  </div>
                ))}
              </div>
            )}
            {view === "日" && (
              <div onClick={() => handleCellClick(currentDate)} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{ e.preventDefault(); e.stopPropagation(); const tpl = JSON.parse(e.dataTransfer.getData("template")); setEvents([...events, { id: Math.random().toString(36), date: currentDate, title: tpl.title, color: tpl.color, start: "09:00", end: "10:00" }]); }} className="h-full p-10 max-w-4xl mx-auto cursor-pointer">
                <div className="bg-white rounded-[32px] p-8 mb-10 shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="text-6xl font-black text-blue-600 tracking-tighter leading-none">{currentDate.getDate()}</div>
                    <div className="h-12 w-[2px] bg-slate-100 hidden md:block" />
                    <div>
                      <div className="text-xl font-black text-slate-800">{['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][currentDate.getDay()]}</div>
                      <div className="text-sm font-bold text-slate-400">{year}年 {month+1}月</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">{renderEvents(currentDate, true)}</div>
              </div>
            )}
          </div>
        </div>

        {/* --- 弹窗组件保持满意版 --- */}
        {(isEditModalOpen || isNewTemplateModalOpen) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1000] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl p-10 space-y-8 border border-white/20">
              <div className="flex justify-between items-center"><h3 className="font-black text-slate-800 text-3xl tracking-tighter">{isEditModalOpen ? "日程详情" : "新建事件模板"}</h3><button onClick={() => { setIsEditModalOpen(false); setIsNewTemplateModalOpen(false); }}><X/></button></div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">任务名称</label>
                  <input autoFocus value={isEditModalOpen ? (editingEvent?.title || "") : newTplTitle} onChange={(e) => isEditModalOpen ? setEditingEvent({...editingEvent, title: e.target.value}) : setNewTplTitle(e.target.value)} className="w-full bg-slate-50 border-none rounded-3xl p-6 font-black text-xl" />
                </div>
                {isEditModalOpen && (
                  <div className="grid grid-cols-2 gap-6">
                    <input type="time" value={editingEvent?.start} onChange={(e)=>setEditingEvent({...editingEvent, start:e.target.value})} className="bg-slate-50 border-none rounded-3xl p-5 font-black" />
                    <input type="time" value={editingEvent?.end} onChange={(e)=>setEditingEvent({...editingEvent, end:e.target.value})} className="bg-slate-50 border-none rounded-3xl p-5 font-black" />
                  </div>
                )}
                <div className="flex flex-wrap gap-4">
                  {colorOptions.map(c => {
                    const isActive = isEditModalOpen ? editingEvent?.color === c.value : newTplColor === c.value;
                    return (
                      <button key={c.value} onClick={() => isEditModalOpen ? setEditingEvent({...editingEvent, color: c.value}) : setNewTplColor(c.value)} className={`w-10 h-10 rounded-full ${c.value} flex items-center justify-center ${isActive ? 'ring-4 ring-slate-200' : ''}`}>{isActive && <Check className="w-5 h-5 text-white" />}</button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-6">
                <button onClick={() => { setIsEditModalOpen(false); setIsNewTemplateModalOpen(false); }} className="flex-1 font-black py-5">取消</button>
                <button onClick={() => {
                  if (isEditModalOpen) setEvents(events.find(ev => ev.id === editingEvent.id) ? events.map(ev => ev.id === editingEvent.id ? editingEvent : ev) : [...events, editingEvent]);
                  else if (newTplTitle) setTemplates([...templates, { id: Date.now().toString(), title: newTplTitle, color: newTplColor }]);
                  setIsEditModalOpen(false); setIsNewTemplateModalOpen(false);
                }} className="flex-[2] bg-blue-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-blue-100">确认</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
