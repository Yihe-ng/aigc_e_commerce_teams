"use client"

import { useState, useRef } from "react"

import { CalendarGrid } from "./calendar-grid"
import { CalendarToolbar } from "./calendar-toolbar"
import { EventModal } from "./event-modal"
import { TemplateSidebar } from "./template-sidebar"
import type { CalendarEvent, CalendarView, EventTemplate } from "./types"
import { createDraftEvent, PAGE_COLORS } from "./types"

export default function MarketingScheduleContent() {
  const today = new Date()
  const [view, setView] = useState<CalendarView>("月")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(null)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const [templates, setTemplates] = useState<EventTemplate[]>([
    { id: "t1", title: "团队开会", color: "bg-slate-300" },
    { id: "t2", title: "发布广告图片", color: "bg-cyan-400" },
    { id: "t3", title: "数据复盘", color: "bg-blue-500" },
  ])

  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: "e1", date: new Date(2026, 3, 2), title: "团队开会", color: "bg-slate-300", start: "10:00", end: "11:30" },
    { id: "e2", date: new Date(2026, 3, 30), title: "团队开会", color: "bg-slate-300", start: "09:00", end: "10:30" },
  ])

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleNav = (dir: number) => {
    const d = new Date(currentDate)
    if (view === "月") d.setMonth(currentDate.getMonth() + dir)
    else if (view === "周") d.setDate(currentDate.getDate() + dir * 7)
    else d.setDate(currentDate.getDate() + dir)
    setCurrentDate(d)
  }

  const handleDrop = (date: Date, template: EventTemplate) => {
    setEvents((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        date,
        title: template.title,
        color: template.color,
        start: "09:00",
        end: "10:00",
      },
    ])
  }

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const openCreateEvent = (date: Date) => {
    setEditingEvent(createDraftEvent(date))
    setIsEditModalOpen(true)
  }

  const openEditEvent = (event: CalendarEvent) => {
    setEditingEvent({ ...event })
    setIsEditModalOpen(true)
  }

  const openCreateTemplate = () => {
    setEditingTemplate(null)
    setIsTemplateModalOpen(true)
  }

  const openEditTemplate = (template: EventTemplate) => {
    setEditingTemplate(template)
    setIsTemplateModalOpen(true)
  }

  const saveTemplate = (template: EventTemplate) => {
    setTemplates((prev) => {
      const exists = prev.find((t) => t.id === template.id)
      if (exists) {
        return prev.map((t) => (t.id === template.id ? template : t))
      }
      return [...prev, template]
    })
    setIsTemplateModalOpen(false)
    setEditingTemplate(null)
  }

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    setIsTemplateModalOpen(false)
    setEditingTemplate(null)
  }

  return (
    <div className="min-h-full space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">营销日程规划</h1>
        <p className="text-sm text-gray-500 mt-1">
          管理您的内容发布节奏，拖拽模板快速安排营销计划。
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        <TemplateSidebar
          templates={templates}
          events={events}
          onOpenCreateTemplate={openCreateTemplate}
          onEditTemplate={openEditTemplate}
          onDeleteTemplate={deleteTemplate}
        />

        <div
          className="flex-1 min-w-0 rounded-3xl flex flex-col overflow-hidden shadow-sm bg-white"
        >
          <CalendarToolbar
            currentDate={currentDate}
            view={view}
            dateInputRef={dateInputRef}
            onNavigate={handleNav}
            onResetToday={() => setCurrentDate(new Date())}
            onChangeView={setView}
            onChangeDate={setCurrentDate}
          />
          <CalendarGrid
            currentDate={currentDate}
            events={events}
            view={view}
            dragOverDate={dragOverDate}
            onDragOverDateChange={setDragOverDate}
            onCreateEvent={openCreateEvent}
            onDropTemplate={handleDrop}
            onEditEvent={openEditEvent}
          />
        </div>
      </div>

      {/* 日程编辑模态框 */}
      <EventModal
        isOpen={isEditModalOpen}
        mode={editingEvent?.id && events.find(e => e.id === editingEvent.id) ? "edit" : "create"}
        event={editingEvent}
        onClose={() => {
          setEditingEvent(null)
          setIsEditModalOpen(false)
        }}
        onSaveEvent={(event) => {
          setEvents((prev) => {
            const exists = prev.find((e) => e.id === event.id)
            if (exists) {
              return prev.map((e) => (e.id === event.id ? event : e))
            }
            return [...prev, event]
          })
          setEditingEvent(null)
          setIsEditModalOpen(false)
        }}
        onDeleteEvent={deleteEvent}
        onSaveTemplate={() => {}}
        onDeleteTemplate={() => {}}
      />

      {/* 模板编辑模态框 */}
      <EventModal
        isOpen={isTemplateModalOpen}
        mode="template"
        template={editingTemplate}
        onClose={() => {
          setEditingTemplate(null)
          setIsTemplateModalOpen(false)
        }}
        onSaveEvent={() => {}}
        onDeleteEvent={() => {}}
        onSaveTemplate={saveTemplate}
        onDeleteTemplate={deleteTemplate}
      />
    </div>
  )
}
