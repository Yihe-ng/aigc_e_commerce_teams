"use client"

import dynamic from "next/dynamic"

const MerchantSourcePanel = dynamic(
  () => import("@/components/dashboard/merchant-source-panel").then(mod => ({ default: mod.MerchantSourcePanel })),
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

export default function MerchantSourcePage() {
  return (
    <MerchantSourcePanel />
  )
}
