"use client"

import type { PlatformInfo, PlatformName } from "./types"

interface PlatformSwitcherProps {
  currentPlatform: PlatformName
  isGenerating: boolean
  platforms: PlatformInfo[]
  onChangePlatform: (platform: PlatformName) => void
}

export function PlatformSwitcher({
  currentPlatform,
  isGenerating,
  platforms,
  onChangePlatform,
}: PlatformSwitcherProps) {
  return (
    <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-black tracking-tight text-slate-800 dark:text-slate-100">发布平台矩阵</span>
        </div>
        <div className="flex flex-wrap rounded-2xl bg-slate-50 p-1.5 dark:bg-slate-800/80">
          {platforms.map((platform) => (
            <button
              key={platform.name}
              type="button"
              onClick={() => onChangePlatform(platform.name)}
              disabled={isGenerating}
              className={`rounded-xl px-6 py-2.5 text-sm font-black transition-all ${
                currentPlatform === platform.name
                  ? `${platform.color} text-white shadow-lg`
                  : "text-slate-400 dark:text-slate-500"
              } ${isGenerating ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {platform.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
