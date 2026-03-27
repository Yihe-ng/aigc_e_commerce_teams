"use client"

import TextGenerateChat from "@/components/ai-tools/textgenerate"

export default function TextGeneratePage() {
  return (
    <div className="h-screen w-full overflow-hidden bg-white flex">
      <aside className="w-56 hidden md:block" />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="h-16 flex-shrink-0" />

        <div className="flex-1 p-4 md:p-6 min-h-0 overflow-hidden">
          <TextGenerateChat />
        </div>
      </main>
    </div>
  )
}
