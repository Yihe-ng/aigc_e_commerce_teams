"use client"

import { usePathname } from "next/navigation"

import { DASHBOARD_NAV } from "@/components/layout/nav-config"

function getAnalyticsPageTitle(pathname: string) {
  const hit = DASHBOARD_NAV.children.find((c) => pathname === c.href || pathname.startsWith(`${c.href}/`))
  return hit?.label ?? ""
}

function getAnalyticsSubtitle(pathname: string) {
  if (pathname.includes("/dashboard/analytics/merchant-source")) {
    return "采集商家渠道与基础信息；提交后可按页面引导完成商品与素材建档。多维统计请看「商家分析看板」。"
  }
  if (pathname.includes("/dashboard/analytics/analyst")) {
    return "全量商家只读分析：来源、行业、区域与活跃趋势。信息采集请使用「商家来源统计」。"
  }
  return "数据看板为占位展示，接入接口后可替换为真实图表与指标"
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const pageTitle = getAnalyticsPageTitle(pathname)

  return (
    <div className="h-full p-4 md:p-6">
      <div className="flex h-full min-h-0 w-full flex-col gap-8 rounded-2xl border-0 bg-[#EFEFEF] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:bg-slate-900/85 dark:shadow-[0_4px_12px_rgba(0,0,0,0.35)] md:p-8">
        {pageTitle ? (
          <div className="space-y-3">
            <h1 className="text-xl font-semibold tracking-tight text-gray-800 sm:text-2xl dark:text-slate-100">
              {pageTitle}
            </h1>
            <p
              className={
                pathname.includes("/dashboard/analytics/merchant-source") ||
                pathname.includes("/dashboard/analytics/analyst")
                  ? "max-w-3xl text-base leading-relaxed text-gray-600 dark:text-slate-300"
                  : "text-sm text-gray-500 dark:text-slate-400"
              }
            >
              {getAnalyticsSubtitle(pathname)}
            </p>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  )
}
