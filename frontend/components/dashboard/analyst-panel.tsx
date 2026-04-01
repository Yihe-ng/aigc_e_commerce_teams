"use client"

import { Card } from "@heroui/react"
import { BadgeCheck, Users } from "lucide-react"
import { useCallback, useState } from "react"

import {
  ACTIVE_ITEMS,
  ChartCard,
  FilterSelect,
  INDUSTRY_ITEMS,
  KpiCard,
  panelHoverClass,
  panelOnMutedBgClass,
  RANGE_ITEMS,
  RefreshAction,
  REGION_ITEMS,
  SOURCE_ITEMS,
  UPDATED_AT,
  formatRefreshedAt,
} from "@/components/dashboard/dashboard-shared"
import { cn } from "@/lib/utils"

export function AnalystPanel() {
  const [dataUpdatedAt, setDataUpdatedAt] = useState(UPDATED_AT)
  const handleRefresh = useCallback(() => {
    setDataUpdatedAt(formatRefreshedAt())
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <RefreshAction onPress={handleRefresh} />
      </div>
      <Card variant="default" className={cn(panelOnMutedBgClass, panelHoverClass)}>
        <Card.Content className="flex flex-col gap-4 pt-4 sm:flex-row sm:flex-wrap sm:items-end">
          <FilterSelect label="来源渠道" defaultValue="referral" items={[...SOURCE_ITEMS]} />
          <FilterSelect label="行业类别" defaultValue="mfg" items={[...INDUSTRY_ITEMS]} />
          <FilterSelect label="区域" defaultValue="sw" items={[...REGION_ITEMS]} />
          <FilterSelect label="活跃状态" defaultValue="all" items={[...ACTIVE_ITEMS]} />
          <FilterSelect label="时间范围" defaultValue="1y" items={[...RANGE_ITEMS]} />
        </Card.Content>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard title="总商家数" value="0" trendLabel="↑ -- 较去年" icon={<Users aria-hidden />} />
        <KpiCard title="活跃商家占比" value="0%" trendLabel="↑ -- 较去年" icon={<BadgeCheck aria-hidden />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="商家来源分布"
          variant="donut"
          updatedAt={dataUpdatedAt}
          legend={[
            { label: "来源分布", color: "#94a3b8" },
            { label: "其他", color: "#cbd5e1" },
          ]}
        />
        <ChartCard title="商家行业类别" variant="bars" updatedAt={dataUpdatedAt} />
        <ChartCard
          title="商家区域分布"
          variant="donut"
          updatedAt={dataUpdatedAt}
          legend={[
            { label: "区域分布", color: "#94a3b8" },
            { label: "其他", color: "#cbd5e1" },
          ]}
        />
      </div>
    </div>
  )
}
