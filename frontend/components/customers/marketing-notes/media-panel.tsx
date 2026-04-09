"use client"

import { ImagePlus, Loader2, Plus, Sparkles, Trash2, UploadCloud, Wand2 } from "lucide-react"

import type { MediaItem } from "./types"

interface MediaPanelProps {
  isGeneratingImage: boolean
  mediaList: MediaItem[]
  onDeleteMedia: (mediaId: string) => void
  onGenerateImage: () => void
  onUploadFiles: (files: FileList | null) => void
}

export function MediaPanel({
  isGeneratingImage,
  mediaList,
  onDeleteMedia,
  onGenerateImage,
  onUploadFiles,
}: MediaPanelProps) {
  return (
    <div className="flex flex-1 flex-col rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center text-xl font-black tracking-tighter text-slate-800 dark:text-slate-100">
          <ImagePlus className="mr-2 h-5 w-5 text-blue-600 dark:text-sky-400" />
          媒体资产管理
        </h3>
        <span className="rounded-lg bg-slate-50 px-3 py-1 text-xs font-black text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          {mediaList.length} / 9 张
        </span>
      </div>

      <div className="custom-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto">
        {mediaList.length > 0 ? (
          <div className="grid auto-rows-max grid-cols-3 gap-4">
            {mediaList.map((media, index) => (
              <div
                key={media.id}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-slate-100 shadow-sm dark:border-slate-800"
              >
                {/* 这里继续保留原生 img，后续如果项目统一改 next/image，可从这层替换。 */}
                <img
                  src={media.url}
                  alt="media"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <button
                  type="button"
                  onClick={() => onDeleteMedia(media.id)}
                  className="absolute right-2 top-2 rounded-xl bg-slate-900/60 p-1.5 text-white opacity-0 transition-all hover:bg-red-500 group-hover:scale-100 group-hover:opacity-100"
                  title="删除素材"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {index === 0 ? (
                  <div className="absolute left-2 top-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
                    头图封面
                  </div>
                ) : null}
              </div>
            ))}
            {mediaList.length < 9 ? (
              <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                <Plus className="mb-2 h-8 w-8 text-slate-300 transition-colors group-hover:text-blue-500 dark:text-slate-600" />
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">添加素材</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*"
                  multiple
                  onChange={(event) => onUploadFiles(event.target.files)}
                />
              </label>
            ) : null}
          </div>
        ) : (
          <label className="relative flex min-h-[300px] flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[24px] border-4 border-dashed border-slate-100 bg-slate-50 transition-all hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800/70">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-110 dark:bg-slate-900">
              <UploadCloud className="h-8 w-8 text-blue-500 dark:text-sky-400" />
            </div>
            <p className="text-lg font-black text-slate-500 transition-colors dark:text-slate-400">点击或拖拽上传图片/视频</p>
            <p className="mt-2 text-xs font-bold text-slate-400 dark:text-slate-500">
              支持 JPG, PNG, MP4 格式，单图最大 5MB
            </p>
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*"
              multiple
              onChange={(event) => onUploadFiles(event.target.files)}
            />
          </label>
        )}
      </div>

      <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-[24px] border border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50/30 p-5 dark:border-blue-900/40 dark:from-slate-800/90 dark:to-slate-900/80 sm:flex-row sm:items-center">
        <div>
          <h4 className="flex items-center text-sm font-black text-slate-800 dark:text-slate-100">
            <Sparkles className="mr-1.5 h-4 w-4 text-blue-600 dark:text-sky-400" />
            API: AI 场景图接口对接处
          </h4>
          <p className="mt-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            当前仍保留原提交里的 Mock 生图行为，后续可从容器组件替换为真实接口。
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerateImage}
          disabled={isGeneratingImage || mediaList.length >= 9}
          className="flex whitespace-nowrap items-center rounded-xl border border-blue-200/60 bg-white px-5 py-2.5 text-sm font-black text-blue-600 transition-all hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100 active:scale-95 disabled:opacity-50 dark:border-blue-800/60 dark:bg-slate-900 dark:text-sky-400 dark:hover:border-sky-500 dark:hover:shadow-sky-900/30"
        >
          {isGeneratingImage ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-1.5 h-4 w-4" />
          )}
          {isGeneratingImage ? "Mock 加载中..." : "一键 Mock 生图"}
        </button>
      </div>
    </div>
  )
}
