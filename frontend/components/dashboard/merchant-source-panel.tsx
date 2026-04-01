"use client"

import { Button, Card, Input, Label, TextField } from "@heroui/react"
import { Check } from "lucide-react"
import { useCallback, useState } from "react"

import {
  FilterSelect,
  INDUSTRY_ITEMS,
  panelHoverClass,
  panelOnMutedBgClass,
  RefreshAction,
  REGION_ITEMS,
  SOURCE_ITEMS,
} from "@/components/dashboard/dashboard-shared"
import { cn } from "@/lib/utils"

export function MerchantSourcePanel() {
  const [, bump] = useState(0)
  const handleRefresh = useCallback(() => bump((n) => n + 1), [])

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <RefreshAction onPress={handleRefresh} />
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        请填写信息，帮助我们分析您的来源渠道
      </p>
      <Card variant="default" className={cn("mx-auto w-full max-w-lg", panelOnMutedBgClass, panelHoverClass)}>
        <Card.Content className="flex flex-col gap-5 pt-6">
          <TextField className="w-full" name="merchantName">
            <Label>商家名称</Label>
            <Input placeholder="请输入您的商家名称" variant="secondary" />
          </TextField>
          <FilterSelect label="来源渠道" placeholder="请选择来源渠道" items={[...SOURCE_ITEMS]} />
          <FilterSelect label="行业类别" placeholder="请选择行业类别" items={[...INDUSTRY_ITEMS]} />
          <FilterSelect label="所在区域" placeholder="请选择所在区域" items={[...REGION_ITEMS]} />
          <Button className="w-full" onPress={() => {}}>
            <Check className="size-4" aria-hidden />
            提交注册信息
          </Button>
        </Card.Content>
      </Card>
      <p className="text-center text-xs text-slate-500">
        © 2026 商家渠道分析系统 · 数据更新时间：—
      </p>
    </div>
  )
}
