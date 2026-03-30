"use client"

import TextGenerateChat from "@/components/ai-tools/textgenerate"

export default function TextGeneratePage() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-4 md:p-6">
      <TextGenerateChat />
    </div>
  )
}
