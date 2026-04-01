"use client"

import { Maximize2, X } from "lucide-react"

interface FullscreenEditorModalProps {
  content: string
  platform: string
  open: boolean
  onChangeContent: (content: string) => void
  onClose: () => void
}

export function FullscreenEditorModal({
  content,
  platform,
  open,
  onChangeContent,
  onClose,
}: FullscreenEditorModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm sm:p-12">
      {/* 这里保留原生全屏编辑弹窗，后续如果需要接 HeroUI Modal/Drawer，可整体替换。 */}
      <div className="flex h-full max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[40px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6">
          <div className="flex items-center">
            <Maximize2 className="mr-3 h-6 w-6 text-blue-600" />
            <h3 className="text-2xl font-black tracking-tighter text-slate-800">沉浸式排版编辑</h3>
            <span className="ml-4 rounded-lg border border-slate-200 px-3 py-1 text-xs font-black text-slate-500">
              {platform}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-100 bg-white p-3 shadow-sm transition-colors hover:bg-slate-100"
          >
            <X className="h-6 w-6 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden bg-slate-50 p-8">
          <textarea
            autoFocus
            value={content}
            onChange={(event) => onChangeContent(event.target.value)}
            className="custom-scrollbar h-full w-full resize-none rounded-[32px] border border-slate-100 bg-white p-10 text-lg font-bold leading-loose text-slate-700 shadow-sm focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
        <div className="flex justify-end border-t border-slate-100 bg-white px-8 py-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-blue-200 transition-transform hover:scale-105 active:scale-95"
          >
            完成编辑并收起
          </button>
        </div>
      </div>
    </div>
  )
}
