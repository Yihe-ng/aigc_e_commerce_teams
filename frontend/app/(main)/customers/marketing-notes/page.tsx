"use client"

import dynamic from "next/dynamic"

const MarketingNotesContent = dynamic(
  () => import("./marketing-notes-content"),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-[85vh] animate-pulse rounded-[40px] bg-muted" />
      </div>
    ),
    ssr: false
  }
)

export default function MarketingNotesPage() {
  return (
    <div className="p-4 md:p-6">
      <MarketingNotesContent />
    </div>
  )
}
