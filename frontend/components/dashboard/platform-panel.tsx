"use client"

import { Button, Card, Checkbox, Label } from "@heroui/react"
import { Banknote, CircleDollarSign } from "lucide-react"
import { useCallback, useState } from "react"

import {
  cardDescriptionClass,
  ChartCard,
  FilterSelect,
  KpiCard,
  panelHoverClass,
  panelOnMutedBgClass,
  RANGE_ITEMS,
  RefreshAction,
  UPDATED_AT,
  formatRefreshedAt,
} from "@/components/dashboard/dashboard-shared"
import { cn } from "@/lib/utils"

export function PlatformPanel() {
  const [dataUpdatedAt, setDataUpdatedAt] = useState(UPDATED_AT)
  const handleRefresh = useCallback(() => {
    setDataUpdatedAt(formatRefreshedAt())
  }, [])

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <RefreshAction onPress={handleRefresh} />
      </div>
      <div className={cn("max-w-md rounded-xl p-4", panelOnMutedBgClass, panelHoverClass)}>
        <FilterSelect label="时间范围" defaultValue="30d" items={[...RANGE_ITEMS]} className="w-full" />
      </div>
      <Card variant="default" className={cn(panelOnMutedBgClass, panelHoverClass)}>
        <Card.Header>
          <Card.Title>平台筛选</Card.Title>
          <Card.Description className={cardDescriptionClass}>
            勾选参与统计的平台，未授权店铺可先完成授权
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          {(
            [
              { id: "jd", name: "京东" },
              { id: "dy", name: "抖音" },
              { id: "xhs", name: "小红书" },
              { id: "tb", name: "淘宝" },
            ] as const
          ).map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 border-b border-border pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <Checkbox defaultSelected id={`plat-${p.id}`} variant="secondary">
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <Label htmlFor={`plat-${p.id}`} className="font-medium">
                    {p.name}
                  </Label>
                </Checkbox.Content>
              </Checkbox>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className="text-sm text-red-600 dark:text-red-400">未授权</span>
                <Button size="sm" variant="primary" className="bg-emerald-600 text-white hover:bg-emerald-700">
                  授权
                </Button>
              </div>
            </div>
          ))}
        </Card.Content>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard title="总销售额" value="¥0" trendLabel="↑ --% 较上月" icon={<Banknote aria-hidden />} />
        <KpiCard title="总利润" value="¥0" trendLabel="↑ --% 较上月" icon={<CircleDollarSign aria-hidden />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="销售额来源分布"
          variant="donut"
          updatedAt={dataUpdatedAt}
          legend={[
            { label: "渠道 A", color: "#64748b" },
            { label: "渠道 B", color: "#94a3b8" },
          ]}
        />
        <ChartCard
          title="利润来源分布"
          variant="donut"
          updatedAt={dataUpdatedAt}
          legend={[
            { label: "渠道 A", color: "#64748b" },
            { label: "渠道 B", color: "#94a3b8" },
          ]}
        />
      </div>
    </div>
  )
}
