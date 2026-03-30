"use client"

import { Card, Separator } from "@heroui/react"
import { usePathname } from "next/navigation"

import { DASHBOARD_NAV } from "@/components/layout/nav-config"

function getAnalyticsPageTitle(pathname: string) {
  const hit = DASHBOARD_NAV.children.find((c) => pathname === c.href || pathname.startsWith(`${c.href}/`))
  return hit?.label ?? ""
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const pageTitle = getAnalyticsPageTitle(pathname)

  return (
    <div className="h-full p-4 md:p-6">
      <div className="flex h-full min-h-0 w-full flex-col gap-6 rounded-2xl border-0 bg-[#EFEFEF] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] md:p-6">
        {pageTitle ? (
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight text-gray-800 sm:text-2xl">{pageTitle}</h1>
            <p className="text-sm text-gray-500">数据看板为占位展示，接入接口后可替换为真实图表与指标</p>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
