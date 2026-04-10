"use client"

import { Plus, Trash2, LayoutTemplate, Calendar, Clock } from "lucide-react"
import type { EventTemplate, CalendarEvent } from "./types"

interface TemplateSidebarProps {
  templates: EventTemplate[]
  events: CalendarEvent[]
  onOpenCreateTemplate: () => void
  onEditTemplate: (template: EventTemplate) => void
  onDeleteTemplate: (id: string) => void
}

export function TemplateSidebar({
  templates,
  events,
  onOpenCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
}: TemplateSidebarProps) {
  // 计算概览统计数据
  const today = new Date()
  const safeEvents = events || []
  const todayEvents = safeEvents.filter((e) => {
    const d = new Date(e.date)
    return d.toDateString() === today.toDateString()
  })
  const upcomingEvents = safeEvents.filter((e) => new Date(e.date) >= today)

  // 拖拽处理
  const handleDragStart = (e: React.DragEvent, tpl: EventTemplate) => {
    e.dataTransfer.setData("template", JSON.stringify(tpl))
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <aside
      className="w-72 flex-shrink-0 flex flex-col rounded-3xl bg-white shadow-sm overflow-hidden"
    >
      {/* 概览统计 */}
      <div className="px-5 py-4 border-b border-gray-200/50">
        <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4" />
          概览
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F8F8F8] rounded-2xl p-3">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-xs">今日</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{todayEvents.length}</p>
            <p className="text-[10px] text-gray-400">个日程</p>
          </div>
          <div className="bg-[#F8F8F8] rounded-2xl p-3">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">待办</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{upcomingEvents.length}</p>
            <p className="text-[10px] text-gray-400">个日程</p>
          </div>
        </div>
      </div>

      {/* 模板列表 */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">事件模板</h2>
          <button
            onClick={onOpenCreateTemplate}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-800 hover:shadow-lg active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            新建
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <LayoutTemplate className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">暂无模板</p>
            <p className="text-[10px] text-gray-300 mt-1">点击上方按钮创建</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                draggable
                onDragStart={(e) => handleDragStart(e, tpl)}
                onClick={() => onEditTemplate(tpl)}
                className="group flex items-center gap-3 p-3 bg-[#F8F8F8] rounded-2xl cursor-move hover:bg-[#EFEFEF] transition-all"
              >
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${tpl.color}`}
                />
                <span className="flex-1 text-sm text-gray-700 truncate font-medium">
                  {tpl.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteTemplate(tpl.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 使用提示 */}
        <div className="mt-6 p-4 bg-[#F8F8F8] rounded-2xl">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <span className="font-medium text-gray-700">💡 提示：</span>
            拖拽模板到日历上即可快速创建日程
          </p>
        </div>
      </div>
    </aside>
  )
}
