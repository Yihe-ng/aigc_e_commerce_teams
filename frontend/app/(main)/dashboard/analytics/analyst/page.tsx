"use client"

import dynamic from "next/dynamic"

const AnalystPanel = dynamic(
  () => import("@/components/dashboard/analyst-panel").then(mod => ({ default: mod.AnalystPanel })),
  {
    loading: () => (
      <div className="space-y-4 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }
)

export default function AnalystPage() {
  return (
    <AnalystPanel />
  )
}
