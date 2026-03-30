"use client"

import { Check, X } from "lucide-react"

import type { CalendarEvent } from "./types"

interface EventModalProps {
  colorOptions: Array<{ name: string; value: string }>
  editingEvent: CalendarEvent | null
  isEditModalOpen: boolean
  isNewTemplateModalOpen: boolean
  newTemplateColor: string
  newTemplateTitle: string
  onChangeEditingEvent: (event: CalendarEvent) => void
  onChangeNewTemplateColor: (color: string) => void
  onChangeNewTemplateTitle: (title: string) => void
  onClose: () => void
  onConfirm: () => void
}

export function EventModal({
  colorOptions,
  editingEvent,
  isEditModalOpen,
  isNewTemplateModalOpen,
  newTemplateColor,
  newTemplateTitle,
  onChangeEditingEvent,
  onChangeNewTemplateColor,
  onChangeNewTemplateTitle,
  onClose,
  onConfirm,
}: EventModalProps) {
  if (!isEditModalOpen && !isNewTemplateModalOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xl">
      {/* 这里暂时保留原生弹窗结构，后续接 HeroUI Modal 时可以整体替换这个节点。 */}
      <div className="w-full max-w-lg rounded-[48px] border border-white/20 bg-white p-10 shadow-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-3xl font-black tracking-tighter text-slate-800">
            {isEditModalOpen ? "日程详情" : "新建事件模板"}
          </h3>
          <button type="button" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">
              任务名称
            </label>
            <input
              autoFocus
              value={isEditModalOpen ? editingEvent?.title ?? "" : newTemplateTitle}
              onChange={(event) => {
                if (isEditModalOpen && editingEvent) {
                  onChangeEditingEvent({ ...editingEvent, title: event.target.value })
                  return
                }
                onChangeNewTemplateTitle(event.target.value)
              }}
              className="w-full rounded-3xl border-none bg-slate-50 p-6 text-xl font-black"
            />
          </div>

          {isEditModalOpen && editingEvent ? (
            <div className="grid grid-cols-2 gap-6">
              <input
                type="time"
                value={editingEvent.start}
                onChange={(event) =>
                  onChangeEditingEvent({ ...editingEvent, start: event.target.value })
                }
                className="rounded-3xl border-none bg-slate-50 p-5 font-black"
              />
              <input
                type="time"
                value={editingEvent.end}
                onChange={(event) =>
                  onChangeEditingEvent({ ...editingEvent, end: event.target.value })
                }
                className="rounded-3xl border-none bg-slate-50 p-5 font-black"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-4">
            {colorOptions.map((option) => {
              const isActive = isEditModalOpen
                ? editingEvent?.color === option.value
                : newTemplateColor === option.value

              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.name}
                  onClick={() => {
                    if (isEditModalOpen && editingEvent) {
                      onChangeEditingEvent({ ...editingEvent, color: option.value })
                      return
                    }
                    onChangeNewTemplateColor(option.value)
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${option.value} ${
                    isActive ? "ring-4 ring-slate-200" : ""
                  }`}
                >
                  {isActive ? <Check className="h-5 w-5 text-white" /> : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-8 flex gap-6">
          <button type="button" onClick={onClose} className="flex-1 py-5 font-black">
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-[2] rounded-3xl bg-blue-600 py-5 font-black text-white shadow-xl shadow-blue-100"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}
