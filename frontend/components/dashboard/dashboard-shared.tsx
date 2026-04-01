"use client"

import { Button, Card, Input, Label, ListBox, Select } from "@heroui/react"
import { RefreshCw, TrendingUp } from "lucide-react"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

export const cardDescriptionClass =
  "text-[15px] leading-snug !text-slate-600 dark:!text-slate-300"

export const panelOnMutedBgClass =
  "!bg-[#fafbfc] shadow-[0_1px_2px_rgba(15,23,42,0.045)] ring-1 ring-slate-900/[0.055] dark:!bg-zinc-900/82 dark:ring-white/[0.07]"

export const panelHoverClass =
  "motion-safe:transition-[box-shadow,transform] motion-safe:duration-200 motion-safe:ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_18px_-6px_rgba(15,23,42,0.1)] dark:hover:shadow-[0_8px_22px_-6px_rgba(0,0,0,0.35)] active:translate-y-0 active:shadow-[0_2px_6px_-4px_rgba(15,23,42,0.08)] dark:active:shadow-[0_2px_8px_-4px_rgba(0,0,0,0.3)]"

export const UPDATED_AT = "2026-03-29 16:43:00"

const REFRESH_SPIN_MS = 650

export function RefreshAction({ onPress }: { onPress: () => void }) {
  const [spinning, setSpinning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    },
    [],
  )

  const handlePress = useCallback(() => {
    onPress()
    setSpinning(true)
    if (timerRef.current != null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setSpinning(false)
      timerRef.current = null
    }, REFRESH_SPIN_MS)
  }, [onPress])

  return (
    <Card variant="default" className={cn("w-fit overflow-hidden rounded-2xl p-0", panelOnMutedBgClass)}>
      <Card.Content className="flex items-center !gap-0 !p-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 min-h-8 rounded-2xl px-2 text-slate-600"
          onPress={handlePress}
        >
          <RefreshCw
            className={cn("size-3.5 shrink-0", spinning && "motion-safe:animate-spin")}
            aria-hidden
          />
          刷新
        </Button>
      </Card.Content>
    </Card>
  )
}

export function KpiCard(props: {
  title: string
  value: string
  trendLabel: string
  icon: ReactNode
  accentClass?: string
}) {
  const { title, value, trendLabel, icon, accentClass = "text-sky-600 dark:text-sky-400" } = props
  return (
    <Card variant="default" className={cn("relative overflow-hidden", panelOnMutedBgClass, panelHoverClass)}>
      <Card.Header className="relative z-10 pb-1">
        <Card.Title className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</Card.Title>
      </Card.Header>
      <Card.Content className="relative z-10 gap-2 pt-0">
        <p className={`text-3xl font-semibold tabular-nums tracking-tight ${accentClass}`}>{value}</p>
        <p className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          {trendLabel}
        </p>
      </Card.Content>
      <div
        className="pointer-events-none absolute bottom-3 right-3 z-0 text-slate-400 opacity-[0.18] dark:text-slate-500 dark:opacity-25 [&_svg]:!size-9 [&_svg]:shrink-0"
        aria-hidden
      >
        {icon}
      </div>
    </Card>
  )
}

export function ChartCard(props: {
  title: string
  variant: "donut" | "bars"
  legend?: { label: string; color: string }[]
  updatedAt?: string
}) {
  const { title, variant, legend, updatedAt = UPDATED_AT } = props
  return (
    <Card variant="default" className={cn("min-h-[280px]", panelOnMutedBgClass, panelHoverClass)}>
      <Card.Header className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
        <Card.Title className="text-base">{title}</Card.Title>
        <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">更新于: {updatedAt}</span>
      </Card.Header>
      <Card.Content className="flex flex-1 flex-col items-center justify-center gap-4 pt-0">
        {variant === "donut" ? (
          <div
            className="size-40 shrink-0 rounded-full border-[14px] border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40"
            aria-hidden
          />
        ) : (
          <div className="flex h-40 w-full max-w-xs flex-col justify-end gap-2 px-2" aria-hidden>
            {[0.45, 0.72, 0.55, 0.9, 0.38].map((h, i) => (
              <div key={i} className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-slate-300 dark:bg-slate-600"
                  style={{ width: `${h * 100}%` }}
                />
              </div>
            ))}
            <span className="text-center text-xs text-slate-500">商家数量</span>
          </div>
        )}
        {legend && legend.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
            {legend.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
                {item.label}
              </span>
            ))}
          </div>
        ) : null}
      </Card.Content>
    </Card>
  )
}

export function FilterSelect(props: {
  label: string
  placeholder?: string
  defaultValue?: string
  items: { id: string; label: string }[]
  className?: string
}) {
  const { label, placeholder = "请选择", defaultValue, items, className } = props
  return (
    <Select
      className={className ?? "min-w-[140px] flex-1"}
      placeholder={placeholder}
      defaultValue={defaultValue}
      variant="secondary"
    >
      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {items.map((item) => (
            <ListBox.Item key={item.id} id={item.id} textValue={item.label}>
              {item.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  )
}

export const SOURCE_ITEMS = [
  { id: "referral", label: "客户推荐" },
  { id: "ads", label: "广告投放" },
  { id: "organic", label: "自然流量" },
] as const

export const INDUSTRY_ITEMS = [
  { id: "mfg", label: "制造" },
  { id: "retail", label: "零售" },
  { id: "svc", label: "服务" },
] as const

export const REGION_ITEMS = [
  { id: "sw", label: "西南" },
  { id: "ec", label: "华东" },
  { id: "nc", label: "华北" },
] as const

export const ACTIVE_ITEMS = [
  { id: "all", label: "全部" },
  { id: "active", label: "活跃" },
  { id: "silent", label: "沉默" },
] as const

export const RANGE_ITEMS = [
  { id: "30d", label: "近30天" },
  { id: "90d", label: "近90天" },
  { id: "1y", label: "近1年" },
] as const

export function formatRefreshedAt() {
  return new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}
