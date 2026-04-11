"use client"

import { Button, Card, Chip, Table } from "@heroui/react"
import { Eye, ImageUp, TriangleAlert } from "lucide-react"

import type { GenerationResult, GenerationTask, TaskStatus } from "./types"

interface GenerationHistoryProps {
  tasks: GenerationTask[]
  onPreview: (task: GenerationTask) => void
  onView: (imageUrl: string) => void
}

const STATUS_META: Record<
  TaskStatus,
  {
    color: "default" | "success" | "warning" | "danger"
    label: string
  }
> = {
  pending: { color: "default", label: "等待中" },
  processing: { color: "warning", label: "生成中" },
  completed: { color: "success", label: "已完成" },
  failed: { color: "danger", label: "失败" },
}

function formatTimestamp(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "时间未知"
  }

  return date.toLocaleString("zh-CN", { hour12: false })
}

function parseGenerationResult(
  result: GenerationTask["result"]
): GenerationResult | null {
  if (!result) {
    return null
  }

  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result) as GenerationResult
      return parsed
    } catch {
      return null
    }
  }

  return result
}

function getResultImageUrl(result: GenerationTask["result"]): string | null {
  return parseGenerationResult(result)?.image_url ?? null
}

export function GenerationHistory({
  tasks,
  onPreview,
  onView,
}: GenerationHistoryProps) {
  const hasTasks = tasks.length > 0

  return (
    <Card className="rounded-xl border-0 bg-[#F8F8F8] shadow-none dark:bg-slate-900/90 dark:ring-1 dark:ring-white/10">
      <Card.Header className="border-b border-gray-200 px-5 py-4 dark:border-slate-700">
        <div>
          <Card.Title className="text-base font-semibold text-gray-800 dark:text-slate-100">
            生成历史
          </Card.Title>
          <Card.Description className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            在此查看你的生成记录和结果。
          </Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="p-0">
        {hasTasks ? (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm text-slate-600 dark:text-slate-300" role="grid" aria-label="营销图生成历史">
              <thead className="border-b border-slate-200 bg-[#EFEFEF] text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold tracking-wider" style={{ width: "25%" }}>任务 ID</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold tracking-wider" style={{ width: "15%" }}>状态</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold tracking-wider" style={{ width: "35%" }}>创建时间</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold tracking-wider" style={{ width: "25%" }}>操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map((task) => {
                  const imageUrl = getResultImageUrl(task.result)
                  const statusMeta = STATUS_META[task.status] ?? STATUS_META.pending

                  return (
                    <tr
                      key={task.id}
                      className="h-16 transition-colors hover:bg-gray-50/60 dark:hover:bg-slate-800/60"
                    >
                      <td className="px-6 py-5">
                        <span className="font-mono text-sm text-slate-600 dark:text-slate-400">
                          {task.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <Chip
                          className="px-3 py-1"
                          color={statusMeta.color}
                          size="md"
                          variant="soft"
                        >
                          {statusMeta.label}
                        </Chip>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">
                        {formatTimestamp(task.created_at)}
                      </td>
                      <td className="px-6 py-5">
                        {imageUrl ? (
                          <div className="flex items-center gap-3">
                            <Button
                              isIconOnly
                              aria-label="预览图片"
                              className="h-9 w-9 rounded-lg text-slate-600 transition-all duration-200 hover:bg-[#91C1FA]/10 hover:text-[#91C1FA] hover:shadow-md hover:shadow-[#91C1FA]/20 active:scale-[0.98] dark:text-slate-400"
                              size="sm"
                              variant="tertiary"
                              onPress={() => onPreview(task)}
                            >
                              <ImageUp className="h-4 w-4" />
                            </Button>
                            <Button
                              isIconOnly
                              aria-label="查看原图"
                              className="h-9 w-9 rounded-lg text-slate-600 transition-all duration-200 hover:bg-[#91C1FA]/10 hover:text-[#91C1FA] hover:shadow-md hover:shadow-[#91C1FA]/20 active:scale-[0.98] dark:text-slate-400"
                              size="sm"
                              variant="tertiary"
                              onPress={() => onView(imageUrl)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : task.status === "failed" ? (
                          <div className="inline-flex items-center gap-2 text-sm text-red-500">
                            <TriangleAlert className="h-4 w-4" />
                            <span>{task.error ?? "生成失败"}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-gray-500 dark:text-slate-400">
            暂无生成历史
          </div>
        )}
      </Card.Content>
    </Card>
  )
}
