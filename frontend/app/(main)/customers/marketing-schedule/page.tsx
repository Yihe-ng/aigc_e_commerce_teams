"use client"

import dynamic from "next/dynamic"

const MarketingScheduleContent = dynamic(
  () => import("@/components/customers/marketing-schedule/marketing-schedule-content"),
  {
    loading: () => (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }
)

export default function MarketingSchedulePage() {
  return (
    <div className="p-4 md:p-6">
      <div className="rounded-3xl bg-[#F8F8F8] p-6">
        <MarketingScheduleContent />
      </div>
    </div>
  )
}
