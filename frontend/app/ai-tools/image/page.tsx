"use client"

import dynamic from "next/dynamic"

const ImageGenerator = dynamic(
  () => import("@/components/ai-tools/image"),
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

export default function ImageGenerationPage() {
  return (
    <div className="min-h-0 flex flex-col p-4 md:p-6">
      <ImageGenerator />
    </div>
  )
}
