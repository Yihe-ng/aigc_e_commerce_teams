"use client"

import type { ReactNode } from "react"
import { Card } from "@heroui/react"

interface ChatContainerProps {
  title: string
  modeSwitcher: ReactNode
  children: ReactNode
  inputArea: ReactNode
}

export function ChatContainer({
  title,
  modeSwitcher,
  children,
  inputArea,
}: ChatContainerProps) {
  return (
    <Card className="h-full min-h-0 w-full rounded-2xl border-0 bg-[#EFEFEF] shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:bg-slate-900/85 dark:shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
      <Card.Header className="flex flex-col items-start border-b border-gray-200 px-4 py-2 md:px-6 dark:border-slate-700">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{title}</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
          {"AI \u9a71\u52a8\u7684\u8425\u9500\u6587\u6848\u751f\u6210\u5de5\u5177"}
        </p>
        <div className="mt-2 flex w-full justify-center">{modeSwitcher}</div>
      </Card.Header>
      <Card.Content className="flex min-h-0 flex-1 flex-col p-0">
        <div className="min-h-0 flex-1 mx-4 mb-4 overflow-hidden rounded-xl border border-gray-200 bg-[#F8F8F8] md:mx-6 dark:border-slate-700 dark:bg-slate-900/60">
          {children}
        </div>
        <div className="px-4 pb-4 md:px-6">{inputArea}</div>
      </Card.Content>
    </Card>
  )
}
