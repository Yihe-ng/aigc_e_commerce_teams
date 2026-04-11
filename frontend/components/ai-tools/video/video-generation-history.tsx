"use client"

import { Button, Card, Chip, Table } from "@heroui/react"
import { Download, Eye, Save, TriangleAlert } from "lucide-react"

import type {
  TaskStatus,
  VideoGenerationResult,
  VideoGenerationTask,
} from "./types"

interface VideoGenerationHistoryProps {
  tasks: VideoGenerationTask[]
  onView: (task: VideoGenerationTask) => void
  onDownload: (task: VideoGenerationTask) => void
  onSave: (task: VideoGenerationTask) => void
  savingTaskId?: string | null
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

function parseVideoResult(
  result: VideoGenerationTask["result"]
): VideoGenerationResult | null {
  if (!result) {
    return null
  }

  if (typeof result === "string") {
    try {
      return JSON.parse(result) as VideoGenerationResult
    } catch {
      return null
    }
  }

  return result
}

function getPreferredVideoUrl(task: VideoGenerationTask): string | null {
  const result = parseVideoResult(task.result)

  return result?.oss_url ?? result?.video_url ?? null
}

function getRawVideoUrl(task: VideoGenerationTask): string | null {
  return parseVideoResult(task.result)?.video_url ?? null
}

function getTaskProductId(task: VideoGenerationTask): string | null {
  const productId = parseVideoResult(task.result)?.product_id

  return typeof productId === "string" && productId.trim()
    ? productId.trim()
    : null
}

function hasSavedOssUrl(task: VideoGenerationTask): boolean {
  return Boolean(parseVideoResult(task.result)?.oss_url)
}

export function VideoGenerationHistory({
  tasks,
  onView,
  onDownload,
  onSave,
  savingTaskId,
}: VideoGenerationHistoryProps) {
  const hasTasks = tasks.length > 0

  return (
    <Card className="rounded-xl border-0 bg-[#F8F8F8] shadow-none dark:bg-slate-900/90 dark:ring-1 dark:ring-white/10">
      <Card.Header className="border-b border-gray-200 px-5 py-4 dark:border-slate-700">
        <div>
          <Card.Title className="text-base font-semibold text-gray-800 dark:text-slate-100">
            生成历史
          </Card.Title>
          <Card.Description className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            可查看历史任务状态，并对已完成视频进行观看、下载和保存。
          </Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="p-0">
        {hasTasks ? (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm text-slate-600 dark:text-slate-300" role="grid" aria-label="视频生成历史">
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
                  const videoUrl = getPreferredVideoUrl(task)
                  const rawVideoUrl = getRawVideoUrl(task)
                  const hasProductId = Boolean(getTaskProductId(task))
                  const isSaved = hasSavedOssUrl(task)
                  const canSave =
                    task.status === "completed" &&
                    Boolean(rawVideoUrl) &&
                    hasProductId &&
                    !isSaved
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
                        {videoUrl ? (
                          <div className="flex items-center gap-3">
                            <Button
                              isIconOnly
                              aria-label="观看视频"
                              className="h-9 w-9 rounded-lg text-slate-600 transition-all duration-200 hover:bg-[#91C1FA]/10 hover:text-[#91C1FA] hover:shadow-md hover:shadow-[#91C1FA]/20 active:scale-[0.98] dark:text-slate-400"
                              size="sm"
                              variant="tertiary"
                              onPress={() => onView(task)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              isIconOnly
                              aria-label="下载视频"
                              className="h-9 w-9 rounded-lg text-slate-600 transition-all duration-200 hover:bg-[#91C1FA]/10 hover:text-[#91C1FA] hover:shadow-md hover:shadow-[#91C1FA]/20 active:scale-[0.98] dark:text-slate-400"
                              size="sm"
                              variant="tertiary"
                              onPress={() => onDownload(task)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {canSave ? (
                              <Button
                                isIconOnly
                                aria-label="保存到素材库"
                                className="h-9 w-9 rounded-lg text-slate-600 transition-all duration-200 hover:bg-[#91C1FA]/10 hover:text-[#91C1FA] hover:shadow-md hover:shadow-[#91C1FA]/20 active:scale-[0.98] dark:text-slate-400"
                                isPending={savingTaskId === task.id}
                                size="sm"
                                variant="tertiary"
                                onPress={() => onSave(task)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            ) : null}
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
