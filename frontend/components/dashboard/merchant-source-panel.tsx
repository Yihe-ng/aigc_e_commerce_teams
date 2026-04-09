"use client"

import { Button, Card, Input, Label, TextField } from "@heroui/react"
import {
  ArrowRight,
  Check,
  ClipboardList,
  Images,
  LineChart,
  Package,
  Sparkles,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"

import {
  FilterSelect,
  INDUSTRY_ITEMS,
  REGION_ITEMS,
  SOURCE_ITEMS,
  cardDescriptionClass,
  panelHoverClass,
  panelOnMutedBgClass,
  RefreshAction,
  UPDATED_AT,
  formatRefreshedAt,
} from "@/components/dashboard/dashboard-shared"
import { cn } from "@/lib/utils"

export function MerchantSourcePanel() {
  const router = useRouter()
  const [dataUpdatedAt, setDataUpdatedAt] = useState(UPDATED_AT)
  const [merchantName, setMerchantName] = useState("")
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [industryId, setIndustryId] = useState<string | null>(null)
  const [regionId, setRegionId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState("")
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success">("idle")

  const handleRefresh = useCallback(() => {
    setDataUpdatedAt(formatRefreshedAt())
  }, [])

  const handleSubmit = useCallback(() => {
    setSubmitError("")
    if (!merchantName.trim()) {
      setSubmitError("请填写商家名称。")
      return
    }
    if (!sourceId || !industryId || !regionId) {
      setSubmitError("请选择来源渠道、行业类别与所在区域。")
      return
    }

    const payload = {
      merchantName: merchantName.trim(),
      source: sourceId,
      industry: industryId,
      region: regionId,
    }
    console.info("[merchant-source] submit (占位，待接 API)", payload)
    setSubmitStatus("success")
  }, [industryId, merchantName, regionId, sourceId])

  const handleResetAnother = useCallback(() => {
    setSubmitStatus("idle")
    setMerchantName("")
    setSourceId(null)
    setIndustryId(null)
    setRegionId(null)
    setSubmitError("")
  }, [])

  return (
    <div className="flex w-full flex-col gap-8 pb-6 md:gap-10 md:pb-8">
      <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="flex min-w-0 max-w-3xl flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-gray-800">渠道信息采集</h2>
          <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
            面向智创电商营销系统：登记商家与渠道信息，便于市场归因与客户跟进。全量分布与趋势请使用「商家分析看板」。
          </p>
        </div>
        <div className="shrink-0 md:pt-1">
          <RefreshAction onPress={handleRefresh} />
        </div>
      </div>

      <div className="grid shrink-0 gap-4 sm:grid-cols-2 lg:gap-6">
        <Card variant="default" className={cn(panelOnMutedBgClass, panelHoverClass)}>
          <Card.Header className="space-y-2 pb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden />
              <Card.Title className="text-base font-semibold">本页职责</Card.Title>
            </div>
            <Card.Description className={cn(cardDescriptionClass, "text-sm leading-relaxed")}>
              采集渠道与基础信息，供运营归因与回访。数据接入 API 后写入业务库。
            </Card.Description>
          </Card.Header>
        </Card>

        <Card variant="default" className={cn(panelOnMutedBgClass, panelHoverClass)}>
          <Card.Header className="space-y-3 pb-3">
            <div className="flex items-center gap-2">
              <LineChart className="size-5 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
              <Card.Title className="text-base font-semibold">多维分析</Card.Title>
            </div>
            <Card.Description className={cn(cardDescriptionClass, "text-sm leading-relaxed")}>
              来源分布、行业结构与区域占比等请看商家分析看板。
            </Card.Description>
            <Button
              variant="secondary"
              size="sm"
              className="mt-1 w-fit"
              onPress={() => router.push("/dashboard/analytics/analyst")}
            >
              打开商家分析看板
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </Card.Header>
        </Card>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
        {/* 左侧：登记表单 / 成功态 */}
        <div className="flex min-h-0 flex-col">
          {submitStatus === "idle" ? (
            <Card
              variant="default"
              className={cn("flex h-full flex-col overflow-hidden", panelOnMutedBgClass, panelHoverClass)}
            >
              <Card.Header className="border-b border-slate-100 px-5 pb-4 pt-5 dark:border-slate-800 sm:px-6">
                <Card.Title className="text-base font-semibold text-gray-800">登记信息</Card.Title>
                <Card.Description className="text-sm leading-relaxed text-gray-500">
                  填写完成后提交；右侧为提交后的推荐建档路径说明。
                </Card.Description>
              </Card.Header>
              <Card.Content className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-5 sm:px-6">
                {submitError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                    {submitError}
                  </p>
                ) : null}
                <TextField className="w-full" name="merchantName">
                  <Label className="text-xs">商家名称</Label>
                  <Input
                    placeholder="请输入商家名称"
                    variant="secondary"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                  />
                </TextField>
                <FilterSelect
                  label="来源渠道"
                  placeholder="请选择"
                  items={[...SOURCE_ITEMS]}
                  selectedKey={sourceId}
                  onSelectionChange={setSourceId}
                />
                <FilterSelect
                  label="行业类别"
                  placeholder="请选择"
                  items={[...INDUSTRY_ITEMS]}
                  selectedKey={industryId}
                  onSelectionChange={setIndustryId}
                />
                <FilterSelect
                  label="所在区域"
                  placeholder="请选择"
                  items={[...REGION_ITEMS]}
                  selectedKey={regionId}
                  onSelectionChange={setRegionId}
                />
                <Button className="mt-auto w-full" size="md" onPress={handleSubmit}>
                  <Check className="size-4" aria-hidden />
                  提交登记
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <Card
              variant="default"
              className={cn(
                "flex h-full flex-col overflow-hidden border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-900/50 dark:bg-emerald-950/30",
                panelHoverClass,
              )}
            >
              <Card.Header className="px-5 pb-2 pt-5 sm:px-6">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <Check className="size-5 shrink-0" aria-hidden />
                  <Card.Title className="text-base font-semibold">登记已提交</Card.Title>
                </div>
                <Card.Description className="text-sm leading-relaxed text-emerald-900/80 dark:text-emerald-100/80">
                  建议继续完成商品与素材建档，便于后续 AIGC 营销流程衔接。
                </Card.Description>
              </Card.Header>
              <Card.Content className="flex flex-1 flex-col gap-3 px-5 pb-6 pt-0 sm:px-6">
                <Button variant="secondary" className="w-full" onPress={() => router.push("/products/basic")}>
                  <Package className="size-4" aria-hidden />
                  前往商品基础信息库
                </Button>
                <Button variant="secondary" className="w-full" onPress={() => router.push("/products/marketing")}>
                  <Images className="size-4" aria-hidden />
                  前往商品营销素材库
                </Button>
                <Button variant="ghost" className="mt-auto w-full text-slate-600" onPress={handleResetAnother}>
                  再登记一条
                </Button>
              </Card.Content>
            </Card>
          )}
        </div>

        {/* 右侧：提交后的推荐路径 */}
        <Card
          variant="default"
          className={cn(
            "flex min-h-[min(28rem,70vh)] flex-col overflow-hidden lg:min-h-0",
            panelOnMutedBgClass,
            panelHoverClass,
          )}
        >
          <Card.Header className="border-b border-slate-100/80 px-5 pb-4 pt-5 dark:border-slate-800 sm:px-6 sm:pb-5 sm:pt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 shrink-0 text-fuchsia-600 dark:text-fuchsia-400" aria-hidden />
              <Card.Title className="text-lg font-semibold">提交后的推荐路径</Card.Title>
            </div>
            <Card.Description className={cn(cardDescriptionClass, "mt-1.5 leading-relaxed")}>
              与智创电商营销流程衔接：先完成渠道登记，再维护商品主数据与营销素材，后续文案、图片与短视频等能力才有稳定素材可用。
            </Card.Description>
          </Card.Header>
          <Card.Content className="flex flex-1 flex-col px-5 pb-6 pt-4 sm:px-6 sm:pb-8">
            <ol className="flex flex-1 flex-col gap-0">
              <li className="flex gap-4 border-b border-slate-100 py-4 first:pt-0 dark:border-slate-800/80">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-800 dark:bg-sky-900/50 dark:text-sky-200">
                  1
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="font-medium text-slate-800 dark:text-slate-100">在本页提交渠道登记</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    填写商家名称并选择来源、行业与区域；提交后数据将写入业务库（接入 API 后）。
                  </p>
                </div>
              </li>
              <li className="flex gap-4 border-b border-slate-100 py-4 dark:border-slate-800/80">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
                  2
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="font-medium text-slate-800 dark:text-slate-100">商品基础信息库</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    录入价格、卖点、主图等，为 AIGC 工作流提供结构化商品数据。
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onPress={() => router.push("/products/basic")}
                  >
                    <Package className="size-4" aria-hidden />
                    去建档
                  </Button>
                </div>
              </li>
              <li className="flex gap-4 py-4 pb-0 last:pb-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                  3
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="font-medium text-slate-800 dark:text-slate-100">商品营销素材库</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    补充详情图、场景图等素材，供营销图与短视频模块调用。
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onPress={() => router.push("/products/marketing")}
                  >
                    <Images className="size-4" aria-hidden />
                    去补充素材
                  </Button>
                </div>
              </li>
            </ol>
          </Card.Content>
        </Card>
      </div>

      <p className="pb-2 text-center text-sm text-slate-500 dark:text-slate-400">
        © 2026 智创电商营销系统 · 最近刷新：{dataUpdatedAt}
      </p>
    </div>
  )
}
