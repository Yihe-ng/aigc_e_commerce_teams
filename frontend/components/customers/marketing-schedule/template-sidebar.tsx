"use client"

import { GripVertical, Plus, X } from "lucide-react"

import type { EventTemplate } from "./types"

interface TemplateSidebarProps {
  templates: EventTemplate[]
  onOpenCreateTemplate: () => void
  onDeleteTemplate: (templateId: string) => void
}

export function TemplateSidebar({
  templates,
  onOpenCreateTemplate,
  onDeleteTemplate,
}: TemplateSidebarProps) {
  return (
    <aside className="w-full xl:w-72">
      <div className="rounded-[32px] border border-slate-100 bg-white p-7 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center font-black italic text-slate-800">
            <Plus className="mr-1 h-4 w-4 text-blue-600" />
            可选择事件
          </h3>
          <button
            type="button"
            onClick={onOpenCreateTemplate}
            className="rounded-xl p-1.5 text-blue-600 transition-colors hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2.5">
          {templates.map((template) => (
            <div
              key={template.id}
              draggable
              onDragStart={(event) => {
                // 这里显式保留拖拽模板的 mock 数据传递，后续若改成服务端模板源，可从这里接入。
                event.dataTransfer.setData("template", JSON.stringify(template))
              }}
              className={`${template.color} group flex cursor-grab items-center justify-between rounded-2xl p-3.5 text-white shadow-sm transition-all`}
            >
              <div className="flex items-center">
                <GripVertical className="mr-2 h-4 w-4 opacity-40" />
                <span className="text-xs font-black">{template.title}</span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteTemplate(template.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
