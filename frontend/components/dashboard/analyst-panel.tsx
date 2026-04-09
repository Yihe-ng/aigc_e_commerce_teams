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
  MERCHANT_FORM_REGION_DONUT_DEMO_SEGMENTS,
  MERCHANT_FORM_REGION_DONUT_LEGEND,
  MERCHANT_FORM_SOURCE_DONUT_DEMO_SEGMENTS,
  MERCHANT_FORM_SOURCE_DONUT_LEGEND,
  cardDescriptionClass,
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
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          只读分析：基于已入库商家全量数据，查看来源、行业、区域与活跃表现。渠道信息登记请使用「商家来源统计」。
        </p>
        <div className="shrink-0 sm:pt-0.5">
          <RefreshAction onPress={handleRefresh} />
        </div>
      </div>
      <Card variant="default" className={cn(panelOnMutedBgClass, panelHoverClass)}>
        <Card.Header className="space-y-1.5 pb-2">
          <Card.Title className="text-lg font-semibold">分析筛选</Card.Title>
          <Card.Description className={cn(cardDescriptionClass, "leading-relaxed")}>
            按渠道、行业、区域、活跃状态与时间范围过滤；下方指标与图表将随筛选条件变化（接入接口后生效）。
          </Card.Description>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-4">
          <FilterSelect label="来源渠道" defaultValue="referral" items={[...SOURCE_ITEMS]} />
          <FilterSelect label="行业类别" defaultValue="mfg" items={[...INDUSTRY_ITEMS]} />
          <FilterSelect label="区域" defaultValue="sw" items={[...REGION_ITEMS]} />
          <FilterSelect label="活跃状态" defaultValue="all" items={[...ACTIVE_ITEMS]} />
          <FilterSelect label="时间范围" defaultValue="1y" items={[...RANGE_ITEMS]} />
        </Card.Content>
      </Card>
      <div className="grid gap-6 sm:grid-cols-2">
        <KpiCard title="总商家数" value="1,286" trendLabel="↑ 12.3% 较去年" icon={<Users aria-hidden />} />
        <KpiCard title="活跃商家占比" value="68.4%" trendLabel="↑ 5.8% 较去年" icon={<BadgeCheck aria-hidden />} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="商家来源分布"
          variant="donut"
          updatedAt={dataUpdatedAt}
          donutSummary={{ value: "1,286", caption: "合计商家" }}
          legend={[...MERCHANT_FORM_SOURCE_DONUT_LEGEND]}
          donutSegments={[...MERCHANT_FORM_SOURCE_DONUT_DEMO_SEGMENTS]}
        />
        <ChartCard
          title="商家行业类别"
          variant="bars"
          updatedAt={dataUpdatedAt}
          barsFooter="单位：家 · 与登记表「行业类别」一致（演示）"
        />
        <ChartCard
          title="商家区域分布"
          variant="donut"
          updatedAt={dataUpdatedAt}
          donutSummary={{ value: "1,286", caption: "合计商家" }}
          legend={[...MERCHANT_FORM_REGION_DONUT_LEGEND]}
          donutSegments={[...MERCHANT_FORM_REGION_DONUT_DEMO_SEGMENTS]}
        />
      </div>
    </div>
  )
}
