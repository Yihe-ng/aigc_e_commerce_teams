"use client"

import dynamic from "next/dynamic"

const TextGenerateChat = dynamic(
  () => import("@/components/ai-tools/textgenerate"),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

export default function TextGeneratePage() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-4 md:p-6">
      <TextGenerateChat />
    </div>
  )
}
