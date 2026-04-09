"use client"

import { useMemo, useState } from "react"

import { CalendarGrid } from "./calendar-grid"
import { CalendarToolbar } from "./calendar-toolbar"
import { EventModal } from "./event-modal"
import { TemplateSidebar } from "./template-sidebar"
import type { CalendarEvent, CalendarView, EventTemplate } from "./types"

const COLOR_OPTIONS = [
  { name: "经典蓝", value: "bg-blue-600" },
  { name: "品牌紫", value: "bg-purple-600" },
  { name: "紧急红", value: "bg-red-500" },
  { name: "活力橙", value: "bg-orange-500" },
  { name: "库存绿", value: "bg-emerald-500" },
  { name: "秒杀黄", value: "bg-amber-400" },
  { name: "营销粉", value: "bg-rose-500" },
] as const

function createDraftEvent(date: Date): CalendarEvent {
  return {
    id: Math.random().toString(36),
    date: new Date(date),
    title: "",
    color: "bg-blue-600",
    start: "09:00",
    end: "10:00",
    desc: "",
  }
}

export default function MarketingScheduleContent() {
  const [view, setView] = useState<CalendarView>("月")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  // 这里保留提交里的 mock 模板数据，后续如果要接真实模板接口，可直接替换为请求结果。
  const [templates, setTemplates] = useState<EventTemplate[]>([
    { id: "t1", title: "团队开会", color: "bg-purple-600" },
    { id: "t2", title: "发布广告图片", color: "bg-sky-500" },
    { id: "t5", title: "666", color: "bg-blue-600" },
  ])

  // 这里保留提交里的 mock 日程数据，方便后续替换成接口或全局状态源。
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: "1",
      date: new Date(2026, 2, 2),
      title: "团队开会",
      color: "bg-purple-600",
      start: "10:01",
      end: "11:30",
      desc: "",
    },
    {
      id: "2",
      date: new Date(2026, 2, 30),
      title: "团队开会",
      color: "bg-purple-600",
      start: "09:00",
      end: "10:30",
      desc: "",
    },
  ])

  const [newTemplateTitle, setNewTemplateTitle] = useState("")
  const [newTemplateColor, setNewTemplateColor] = useState("bg-blue-600")

  const handleNavigate = (direction: number) => {
    const nextDate = new Date(currentDate)
    if (view === "月") {
      nextDate.setMonth(currentDate.getMonth() + direction)
    } else if (view === "周") {
      nextDate.setDate(currentDate.getDate() + direction * 7)
    } else {
      nextDate.setDate(currentDate.getDate() + direction)
    }
    setCurrentDate(nextDate)
  }

  const openCreateEvent = (date: Date) => {
    setEditingEvent(createDraftEvent(date))
    setIsEditModalOpen(true)
  }

  const handleDropTemplate = (date: Date, template: EventTemplate) => {
    setEvents((current) => [
      ...current,
      {
        id: Math.random().toString(36),
        date,
        title: template.title,
        color: template.color,
        start: "09:00",
        end: "10:00",
        desc: "",
      },
    ])
  }

  const handleConfirmModal = () => {
    if (isEditModalOpen && editingEvent) {
      setEvents((current) =>
        current.some((item) => item.id === editingEvent.id)
          ? current.map((item) => (item.id === editingEvent.id ? editingEvent : item))
          : [...current, editingEvent]
      )
    }

    if (isNewTemplateModalOpen && newTemplateTitle.trim()) {
      setTemplates((current) => [
        ...current,
        {
          id: Date.now().toString(),
          title: newTemplateTitle.trim(),
          color: newTemplateColor,
        },
      ])
      setNewTemplateTitle("")
      setNewTemplateColor("bg-blue-600")
    }

    setIsEditModalOpen(false)
    setIsNewTemplateModalOpen(false)
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setIsNewTemplateModalOpen(false)
  }

  const shellClassName = useMemo(
    () =>
      "flex min-h-0 flex-col gap-6 rounded-[40px] bg-slate-50 p-4 md:p-6 dark:bg-slate-950 xl:flex-row",
    []
  )

  return (
    <div className={shellClassName}>
      <TemplateSidebar
        templates={templates}
        onOpenCreateTemplate={() => setIsNewTemplateModalOpen(true)}
        onDeleteTemplate={(templateId) =>
          setTemplates((current) => current.filter((item) => item.id !== templateId))
        }
      />

      {/* 这里是页面视觉主容器，后续若要继续强化视觉层，可优先调整这一层而不是改布局壳。 */}
      <section className="flex min-h-[720px] min-w-0 flex-1 flex-col overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none">
        <CalendarToolbar
          currentDate={currentDate}
          view={view}
          onNavigate={handleNavigate}
          onResetToday={() => setCurrentDate(new Date())}
          onChangeView={setView}
          onChangeDate={setCurrentDate}
        />
        <CalendarGrid
          currentDate={currentDate}
          events={events}
          view={view}
          onCreateEvent={openCreateEvent}
          onDropTemplate={handleDropTemplate}
          onEditEvent={(event) => {
            setEditingEvent(event)
            setIsEditModalOpen(true)
          }}
        />
      </section>

      <EventModal
        colorOptions={[...COLOR_OPTIONS]}
        editingEvent={editingEvent}
        isEditModalOpen={isEditModalOpen}
        isNewTemplateModalOpen={isNewTemplateModalOpen}
        newTemplateColor={newTemplateColor}
        newTemplateTitle={newTemplateTitle}
        onChangeEditingEvent={setEditingEvent}
        onChangeNewTemplateColor={setNewTemplateColor}
        onChangeNewTemplateTitle={setNewTemplateTitle}
        onClose={handleCloseModal}
        onConfirm={handleConfirmModal}
      />
    </div>
  )
}
