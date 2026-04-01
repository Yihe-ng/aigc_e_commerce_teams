"use client"

import { Eraser, X } from "lucide-react"

interface ClearConfirmModalProps {
  open: boolean
  platform: string
  onCancel: () => void
  onConfirm: () => void
}

export function ClearConfirmModal({
  open,
  platform,
  onCancel,
  onConfirm,
}: ClearConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm sm:p-12">
      {/* 这里保留独立确认弹窗结构，后续如果统一接入 HeroUI Modal，可直接替换。 */}
      <div className="w-full max-w-lg overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-red-50/50 px-8 py-6">
          <div className="flex items-center">
            <Eraser className="mr-3 h-6 w-6 text-red-500" />
            <h3 className="text-2xl font-black tracking-tighter text-slate-800">清空确认</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-100 bg-white p-3 shadow-sm transition-colors hover:bg-slate-100"
          >
            <X className="h-6 w-6 text-slate-500" />
          </button>
        </div>
        <div className="bg-white p-8 text-center">
          <p className="text-lg font-bold leading-relaxed text-slate-700">
            确定要清空【<span className="font-black text-red-500">{platform}</span>】的所有文案吗？
          </p>
          <p className="mt-2 text-sm font-bold text-slate-400">
            此操作不可撤销，且不会影响其他平台
          </p>
        </div>
        <div className="flex justify-end gap-4 border-t border-slate-100 bg-white px-8 py-6">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-slate-50 px-6 py-3.5 font-black text-slate-500 transition-all hover:bg-slate-100 active:scale-95"
          >
            我再想想
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-500 px-6 py-3.5 font-black text-white shadow-xl shadow-red-200 transition-all hover:scale-105 active:scale-95"
          >
            确认清空文案
          </button>
        </div>
      </div>
    </div>
  )
}
