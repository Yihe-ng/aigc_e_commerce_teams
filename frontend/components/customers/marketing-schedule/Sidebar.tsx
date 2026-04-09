import React from "react";
import { Plus, GripVertical, X } from "lucide-react";
import { Template, CalEvent, BG, CARD } from "./types";

interface SidebarProps {
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  events: CalEvent[];
  year: number;
  month: number;
  onAddTemplate: () => void;
}

export default function Sidebar({ templates, setTemplates, events, year, month, onAddTemplate }: SidebarProps) {
  return (
    <aside className="w-full xl:w-56 shrink-0 space-y-4">
      <div className="rounded-2xl p-5 shadow-sm" style={{ background: CARD }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-800">可选事件模板</h3>
          <button
            onClick={onAddTemplate}
            className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 transition-colors"
            style={{ background: BG }}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">拖拽到格子快速添加</p>
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
  );
}
