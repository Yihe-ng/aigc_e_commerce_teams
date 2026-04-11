"use client"

import { useEffect, useState } from "react"
import { X, Trash2 } from "lucide-react"
import type { CalendarEvent, EventTemplate, ColorOption } from "./types"
import { COLOR_OPTIONS } from "./types"

interface EventModalProps {
  isOpen: boolean
  mode: "create" | "edit" | "template"
  event?: CalendarEvent | null
  template?: EventTemplate | null
  initialDate?: Date | null
  onClose: () => void
  onSaveEvent: (event: CalendarEvent) => void
  onDeleteEvent: (id: string) => void
  onSaveTemplate: (template: EventTemplate) => void
  onDeleteTemplate: (id: string) => void
}

export function EventModal({
  isOpen,
  mode,
  event,
  template,
  initialDate,
  onClose,
  onSaveEvent,
  onDeleteEvent,
  onSaveTemplate,
  onDeleteTemplate,
}: EventModalProps) {
  // 表单状态
  const [title, setTitle] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [desc, setDesc] = useState("")
  const [color, setColor] = useState<ColorOption>(COLOR_OPTIONS[0])
  const [date, setDate] = useState<Date>(new Date())

  // 初始化表单数据
  useEffect(() => {
    if (!isOpen) return

    if (mode === "edit" && event) {
      setTitle(event.title)
      setStart(event.start)
      setEnd(event.end)
      setDesc(event.desc || "")
      setColor(COLOR_OPTIONS.find((c) => c.value === event.color) || COLOR_OPTIONS[0])
      setDate(event.date)
    } else if (mode === "template" && template) {
      setTitle(template.title)
      setColor(COLOR_OPTIONS.find((c) => c.value === template.color) || COLOR_OPTIONS[0])
    } else {
      setTitle("")
      setStart("09:00")
      setEnd("10:00")
      setDesc("")
      setColor(COLOR_OPTIONS[0])
      setDate(initialDate || new Date())
    }
  }, [isOpen, mode, event, template, initialDate])

  if (!isOpen) return null

  const isTemplateMode = mode === "template"
  const isEditMode = mode === "edit"

  // 验证时间逻辑
  const isTimeValid = () => {
    if (isTemplateMode) return true
    return start < end
  }

  const handleSave = () => {
    if (!title.trim()) return
    if (!isTimeValid()) {
      alert("结束时间必须晚于开始时间")
      return
    }

    if (isTemplateMode) {
      const newTemplate: EventTemplate = {
        id: template?.id || Date.now().toString(),
        title: title.trim(),
        color: color.value,
      }
      onSaveTemplate(newTemplate)
    } else {
      const newEvent: CalendarEvent = {
        id: event?.id || Date.now().toString(),
        date,
        title: title.trim(),
        color: color.value,
        start,
        end,
        desc: desc.trim() || undefined,
      }
      onSaveEvent(newEvent)
    }
    onClose()
  }

  const handleDelete = () => {
    if (isTemplateMode && template) {
      onDeleteTemplate(template.id)
    } else if (isEditMode && event) {
      onDeleteEvent(event.id)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {isTemplateMode
              ? template
                ? "编辑模板"
                : "新建模板"
              : isEditMode
                ? "编辑日程"
                : "新建日程"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="px-6 py-5 space-y-4">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {isTemplateMode ? "模板名称" : "日程标题"}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isTemplateMode ? "输入模板名称" : "输入日程标题"}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none text-sm transition-colors"
              autoFocus
            />
          </div>

          {/* 日期选择 - 非模板模式 */}
          {!isTemplateMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">日期</label>
              <input
                type="date"
                value={date.toISOString().split("T")[0]}
                onChange={(e) => setDate(new Date(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none text-sm transition-colors"
              />
            </div>
          )}

          {/* 时间选择 - 非模板模式 */}
          {!isTemplateMode && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">开始时间</label>
                <input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">结束时间</label>
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none text-sm transition-colors"
                />
              </div>
            </div>
          )}

          {/* 描述 - 非模板模式 */}
          {!isTemplateMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="添加描述（可选）"
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-gray-400 focus:outline-none text-sm resize-none transition-colors"
              />
            </div>
          )}

          {/* 颜色选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">颜色</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`
                    w-8 h-8 rounded-lg transition-all
                    ${color.value === c.value ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}
                  `}
                  style={{ backgroundColor: c.dot }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          {(isEditMode || (isTemplateMode && template)) && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !isTimeValid()}
              className="px-5 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
