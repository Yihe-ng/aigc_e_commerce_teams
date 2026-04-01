"use client"

import {
  Bot,
  Eraser,
  Hash,
  Loader2,
  Maximize2,
  Smartphone,
  Sparkles,
  Type,
  Wand2,
} from "lucide-react"
import { RefObject } from "react"

import type { PlatformDraft, PlatformInfo } from "./types"

interface NotesEditorProps {
  currentDraft: PlatformDraft
  currentPlatformInfo: PlatformInfo | undefined
  globalTitle: string
  isGenerating: boolean
  platform: string
  textareaRef: RefObject<HTMLTextAreaElement | null>
  onChangeTitle: (title: string) => void
  onChangeContent: (content: string) => void
  onChangeTags: (tags: string) => void
  onGenerate: () => void
  onOpenClearConfirm: () => void
  onOpenFullscreen: () => void
}

export function NotesEditor({
  currentDraft,
  currentPlatformInfo,
  globalTitle,
  isGenerating,
  platform,
  textareaRef,
  onChangeTitle,
  onChangeContent,
  onChangeTags,
  onGenerate,
  onOpenClearConfirm,
  onOpenFullscreen,
}: NotesEditorProps) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="relative flex flex-1 flex-col overflow-hidden rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
        {isGenerating ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[32px] bg-white/70 backdrop-blur-md">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-600" />
            <p className="text-lg font-black tracking-tighter text-blue-600">
              AI 正在为 {platform} 深度订制文案...
            </p>
          </div>
        ) : null}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <h3 className="flex items-center text-xl font-black tracking-tighter text-slate-800">
              <Type className="mr-2 h-5 w-5 text-blue-600" />
              智能营销文案
            </h3>
            <span className="flex items-center rounded-lg bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-600">
              <Bot className="mr-1 h-3.5 w-3.5" />
              当前引擎: {currentPlatformInfo?.aiPrompt}
            </span>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            {currentDraft.content ? "追加新版本" : "AI 一键润色"}
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6">
          <div>
            <input
              placeholder="填写吸引人的产品名称..."
              value={globalTitle}
              onChange={(event) => onChangeTitle(event.target.value)}
              className="w-full rounded-2xl border-none bg-slate-50 p-5 text-lg font-black placeholder:text-slate-300 focus:ring-4 focus:ring-blue-500/10"
              maxLength={30}
            />
            <div className="mt-2 text-right text-[10px] font-black text-slate-300">
              {globalTitle.length}/30
            </div>
          </div>

          <div className="group/textarea relative flex-1">
            <textarea
              ref={textareaRef}
              placeholder="随便写点卖点，比如：这款面霜很保湿。连续点击右下角按钮，可生成多个版本对比。"
              value={currentDraft.content}
              onChange={(event) => onChangeContent(event.target.value)}
              className="custom-scrollbar h-full min-h-[300px] w-full resize-y rounded-3xl border-none bg-slate-50 p-6 pb-16 font-bold leading-relaxed text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-blue-500/10"
            />

            <button
              type="button"
              onClick={onOpenClearConfirm}
              className="absolute right-16 top-4 rounded-xl border border-slate-100 bg-white p-2.5 text-slate-400 opacity-0 shadow-sm transition-all hover:scale-105 hover:text-red-500 active:scale-95 group-hover/textarea:opacity-100"
              title={`清空 ${platform} 的文案`}
            >
              <Eraser className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onOpenFullscreen}
              className="absolute right-4 top-4 rounded-xl border border-slate-100 bg-white p-2.5 text-slate-400 opacity-0 shadow-sm transition-all hover:scale-105 hover:text-blue-600 active:scale-95 group-hover/textarea:opacity-100"
              title="全屏沉浸式编辑"
            >
              <Maximize2 className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating}
              className="absolute bottom-6 right-8 rounded-2xl border border-slate-50 bg-white p-4 text-blue-600 shadow-xl shadow-blue-100 transition-all hover:-rotate-12 hover:scale-110 hover:bg-blue-50 active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Wand2 className="h-6 w-6" />}
            </button>
          </div>

          {platform !== "朋友圈" ? (
            <div className="flex items-center rounded-2xl bg-slate-50 p-4 transition-all focus-within:ring-4 focus-within:ring-blue-500/10">
              <Hash className="mr-3 h-5 w-5 text-slate-400" />
              <input
                placeholder="添加话题标签，用空格隔开"
                value={currentDraft.tags}
                onChange={(event) => onChangeTags(event.target.value)}
                className="flex-1 border-none bg-transparent p-0 font-bold text-slate-600 placeholder:text-slate-300 focus:ring-0"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-black text-slate-500">
          <Smartphone className="h-4 w-4 text-slate-400" />
          平台风格与文案生成逻辑已按原提交保留，后续如需接真实 AI 服务，可优先从容器组件内的 mock 生成函数替换。
        </div>
      </div>
    </div>
  )
}
