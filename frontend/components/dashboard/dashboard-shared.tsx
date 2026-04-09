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
  className?: string
}) {
  const { title, value, trendLabel, icon, accentClass = "text-sky-600 dark:text-sky-400", className } = props
  return (
    <Card variant="default" className={cn("relative shrink-0 overflow-hidden", panelOnMutedBgClass, panelHoverClass, className)}>
      <Card.Header className="relative z-10 pb-2 pt-1">
        <Card.Title className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</Card.Title>
      </Card.Header>
      <Card.Content className="relative z-10 gap-3 pb-5 pt-0">
        <p className={`text-3xl font-semibold tabular-nums tracking-tight ${accentClass}`}>{value}</p>
        <p className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          <TrendingUp className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
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

/** 圆环图中心汇总（占位演示，接入接口后由接口数据填充） */
export type ChartDonutSummary = {
  value: string
  /** 主数值下方说明，如「合计商家」 */
  caption?: string
}

/** 圆环分段：颜色 + 占比（0–1），各段之和建议为 1（将自动归一化） */
export type ChartDonutSegment = {
  color: string
  percent: number
}

function normalizeDonutSegments(segments: ChartDonutSegment[]): ChartDonutSegment[] {
  const sum = segments.reduce((acc, s) => acc + s.percent, 0)
  if (sum <= 0) return segments
  return segments.map((s) => ({ color: s.color, percent: s.percent / sum }))
}

/** 未传 donutSegments 时，按图例颜色生成演示占比 */
function buildDonutSegmentsFromLegend(
  legend: { label: string; color: string }[] | undefined,
): ChartDonutSegment[] {
  if (!legend?.length) {
    return normalizeDonutSegments([
      { color: "#64748b", percent: 0.38 },
      { color: "#94a3b8", percent: 0.34 },
      { color: "#cbd5e1", percent: 0.28 },
    ])
  }
  if (legend.length === 2) {
    return normalizeDonutSegments([
      { color: legend[0].color, percent: 0.52 },
      { color: legend[1].color, percent: 0.48 },
    ])
  }
  if (legend.length === 3) {
    return normalizeDonutSegments([
      { color: legend[0].color, percent: 0.38 },
      { color: legend[1].color, percent: 0.34 },
      { color: legend[2].color, percent: 0.28 },
    ])
  }
  const n = legend.length
  return normalizeDonutSegments(legend.map((l) => ({ color: l.color, percent: 1 / n })))
}

/** 横向条形图一行：标签 + 比例条 + 数值（占位演示，接入接口后替换） */
export type ChartBarItem = {
  label: string
  /** 用于条长度（将与最大值为比） */
  value: number
  /** 右侧展示，默认使用 value 千分位 */
  valueLabel?: string
  /** 填色，默认 sky */
  barColorClassName?: string
}

function BarChartRows({ items, title }: { items: ChartBarItem[]; title: string }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  const defaultBar = "bg-sky-500/90 dark:bg-sky-500/75"

  return (
    <div
      className="w-full max-w-lg space-y-3 px-0.5"
      role="list"
      aria-label={`${title}，各分类商家数量`}
    >
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 sm:gap-3" role="listitem">
          <span
            className="w-[4.5rem] shrink-0 truncate text-right text-xs font-medium text-slate-700 dark:text-slate-200 sm:w-28 sm:text-sm"
            title={item.label}
          >
            {item.label}
          </span>
          <div className="min-w-0 flex-1">
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={cn("h-full rounded-full", item.barColorClassName ?? defaultBar)}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="w-12 shrink-0 text-right text-xs tabular-nums text-slate-600 dark:text-slate-300 sm:w-14 sm:text-sm">
            {item.valueLabel ?? item.value.toLocaleString("zh-CN")}
          </span>
        </div>
      ))}
    </div>
  )
}

function DonutRingSvg({
  segments,
  className,
}: {
  segments: ChartDonutSegment[]
  className?: string
}) {
  const cx = 50
  const cy = 50
  const r = 38
  const strokeWidth = 10
  const c = 2 * Math.PI * r
  let offset = 0
  const segs = normalizeDonutSegments(segments)

  return (
    <svg className={cn("size-full", className)} viewBox="0 0 100 100" aria-hidden>
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          className="text-slate-200 dark:text-slate-700"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        {segs.map((seg, i) => {
          const dash = seg.percent * c
          const node = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${c}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          )
          offset += dash
          return node
        })}
      </g>
    </svg>
  )
}

export function ChartCard(props: {
  title: string
  variant: "donut" | "bars"
  legend?: { label: string; color: string }[]
  /** 仅 variant 为 donut：各段颜色与占比；不传则根据 legend 生成演示数据 */
  donutSegments?: ChartDonutSegment[]
  /** 仅 variant 为 donut 时生效：圆环中心展示的汇总 */
  donutSummary?: ChartDonutSummary
  /** 仅 variant 为 bars：各行标签与数值；不传则使用内置行业演示数据 */
  barItems?: ChartBarItem[]
  /** 条形图底部说明，如「单位：家」 */
  barsFooter?: string
  updatedAt?: string
  className?: string
}) {
  const {
    title,
    variant,
    legend,
    donutSegments,
    donutSummary,
    barItems,
    barsFooter = "单位：家",
    updatedAt = UPDATED_AT,
    className,
  } = props

  const resolvedDonutSegments =
    variant === "donut"
      ? donutSegments?.length
        ? normalizeDonutSegments(donutSegments)
        : buildDonutSegmentsFromLegend(legend)
      : []

  const resolvedBarItems =
    variant === "bars" ? (barItems?.length ? barItems : MERCHANT_FORM_INDUSTRY_BAR_DEMO) : []
  return (
    <Card
      variant="default"
      className={cn(
        "min-h-[300px] shrink-0 sm:min-h-[320px]",
        panelOnMutedBgClass,
        panelHoverClass,
        className,
      )}
    >
      <Card.Header className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3 pt-1">
        <Card.Title className="text-base font-semibold sm:text-lg">{title}</Card.Title>
        <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">更新于: {updatedAt}</span>
      </Card.Header>
      <Card.Content className="flex flex-col items-center justify-center gap-4 px-4 pb-6 pt-0 sm:px-6">
        {variant === "donut" ? (
          <div
            className="relative flex size-44 shrink-0 items-center justify-center sm:size-48"
            {...{
              role: "img" as const,
              "aria-label": donutSummary
                ? `${title}，汇总 ${donutSummary.value}${
                    donutSummary.caption ? `，${donutSummary.caption}` : ""
                  }`
                : `${title}，演示分布`,
            }}
          >
            <div className="absolute inset-0 drop-shadow-sm">
              <DonutRingSvg segments={resolvedDonutSegments} />
            </div>
            {donutSummary ? (
              <div className="relative z-10 flex max-w-[6.5rem] flex-col items-center justify-center px-1 text-center sm:max-w-[7.25rem]">
                <span className="text-lg font-semibold tabular-nums leading-tight tracking-tight text-slate-800 dark:text-slate-100 sm:text-xl">
                  {donutSummary.value}
                </span>
                {donutSummary.caption ? (
                  <span className="mt-1 text-[11px] font-medium leading-snug text-slate-500 dark:text-slate-400 sm:text-xs">
                    {donutSummary.caption}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex w-full flex-col items-stretch gap-3">
            <BarChartRows items={resolvedBarItems} title={title} />
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">{barsFooter}</p>
          </div>
        )}
        {legend && legend.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
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
  /** 与 onSelectionChange 同时传入时为受控模式 */
  selectedKey?: string | null
  onSelectionChange?: (key: string | null) => void
}) {
  const { label, placeholder = "请选择", defaultValue, items, className, selectedKey, onSelectionChange } = props
  const controlled = typeof onSelectionChange === "function" && selectedKey !== undefined
  return (
    <Select
      className={className ?? "min-w-[140px] flex-1"}
      placeholder={placeholder}
      variant="secondary"
      {...(controlled
        ? {
            selectedKey: selectedKey ?? null,
            onSelectionChange: (key: unknown) =>
              onSelectionChange?.(key == null || key === "" ? null : String(key)),
          }
        : { defaultValue })}
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

const SOURCE_FORM_DONUT_COLORS = ["#0ea5e9", "#8b5cf6", "#14b8a6"] as const

/** 与登记表「来源渠道」选项一致的圆环图例与演示分段（接入接口后替换） */
export const MERCHANT_FORM_SOURCE_DONUT_LEGEND = SOURCE_ITEMS.map((item, i) => ({
  label: item.label,
  color: SOURCE_FORM_DONUT_COLORS[i] ?? "#94a3b8",
}))

export const MERCHANT_FORM_SOURCE_DONUT_DEMO_SEGMENTS: ChartDonutSegment[] = SOURCE_ITEMS.map(
  (_item, i) => ({
    color: SOURCE_FORM_DONUT_COLORS[i] ?? "#94a3b8",
    percent: [0.38, 0.28, 0.34][i] ?? 1 / 3,
  }),
)

export const INDUSTRY_ITEMS = [
  { id: "mfg", label: "制造" },
  { id: "retail", label: "零售" },
  { id: "svc", label: "服务" },
] as const

/** 与登记表「行业类别」一致；演示户数合计 1,286（与 KPI 对齐） */
export const MERCHANT_FORM_INDUSTRY_BAR_DEMO: ChartBarItem[] = INDUSTRY_ITEMS.map((item, i) => ({
  label: item.label,
  value: [428, 372, 486][i] ?? 0,
}))

export const REGION_ITEMS = [
  { id: "sw", label: "西南" },
  { id: "ec", label: "华东" },
  { id: "nc", label: "华北" },
] as const

const REGION_FORM_DONUT_COLORS = ["#f59e0b", "#3b82f6", "#64748b"] as const

/** 与登记表「所在区域」选项一致的圆环图例与演示分段（接入接口后替换） */
export const MERCHANT_FORM_REGION_DONUT_LEGEND = REGION_ITEMS.map((item, i) => ({
  label: item.label,
  color: REGION_FORM_DONUT_COLORS[i] ?? "#94a3b8",
}))

export const MERCHANT_FORM_REGION_DONUT_DEMO_SEGMENTS: ChartDonutSegment[] = REGION_ITEMS.map(
  (_item, i) => ({
    color: REGION_FORM_DONUT_COLORS[i] ?? "#94a3b8",
    percent: [0.35, 0.4, 0.25][i] ?? 1 / 3,
  }),
)

/** 平台销售概览：与本页「平台筛选」列表一致（接入接口后选项仍应与此 id/文案对齐） */
export const PLATFORM_SALES_ITEMS = [
  { id: "jd", label: "京东" },
  { id: "dy", label: "抖音" },
  { id: "xhs", label: "小红书" },
  { id: "tb", label: "淘宝" },
] as const

const PLATFORM_SALES_DONUT_COLORS = ["#0ea5e9", "#f43f5e", "#ec4899", "#f59e0b"] as const

export const PLATFORM_SALES_DONUT_LEGEND = PLATFORM_SALES_ITEMS.map((item, i) => ({
  label: item.label,
  color: PLATFORM_SALES_DONUT_COLORS[i] ?? "#94a3b8",
}))

/** 销售额按平台演示占比 */
export const PLATFORM_SALES_REVENUE_DONUT_DEMO_SEGMENTS: ChartDonutSegment[] = PLATFORM_SALES_ITEMS.map(
  (_item, i) => ({
    color: PLATFORM_SALES_DONUT_COLORS[i] ?? "#94a3b8",
    percent: [0.32, 0.28, 0.22, 0.18][i] ?? 0.25,
  }),
)

/** 利润按平台演示占比（可与销售额结构略有不同） */
export const PLATFORM_SALES_PROFIT_DONUT_DEMO_SEGMENTS: ChartDonutSegment[] = PLATFORM_SALES_ITEMS.map(
  (_item, i) => ({
    color: PLATFORM_SALES_DONUT_COLORS[i] ?? "#94a3b8",
    percent: [0.28, 0.3, 0.24, 0.18][i] ?? 0.25,
  }),
)

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
