"use client"

import { Button, Card, Chip, Table } from "@heroui/react"
import { Eye, ImageUp, TriangleAlert } from "lucide-react"

import type { GenerationResult, GenerationTask, TaskStatus } from "./types"

interface GenerationHistoryProps {
  tasks: GenerationTask[]
  onPreview: (imageUrl: string) => void
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

function getResultImageUrl(result: GenerationTask["result"]): string | null {
  if (!result) {
    return null
  }

  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result) as GenerationResult
      return parsed.image_url ?? null
    } catch {
      return null
    }
  }

  return result.image_url ?? null
}

export function GenerationHistory({
  tasks,
  onPreview,
  onView,
}: GenerationHistoryProps) {
  const hasTasks = tasks.length > 0

  return (
    <Card className="rounded-xl border-0 bg-[#F8F8F8] shadow-none">
      <Card.Header className="border-b border-gray-200 px-5 py-4">
        <div>
          <Card.Title className="text-base font-semibold text-gray-800">
            生成历史
          </Card.Title>
          <Card.Description className="mt-1 text-sm text-gray-500">
            在此处查看你的生成历史和结果
          </Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="p-0">
        {hasTasks ? (
          <Table className="w-full">
            <Table.ScrollContainer>
              <Table.Content aria-label="营销图生成历史" className="w-full">
                <Table.Header>
                  <Table.Column className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    任务 ID
                  </Table.Column>
                  <Table.Column className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    状态
                  </Table.Column>
                  <Table.Column className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    创建时间
                  </Table.Column>
                  <Table.Column className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                    操作
                  </Table.Column>
                </Table.Header>
                <Table.Body items={tasks}>
                  {(task) => {
                    const imageUrl = getResultImageUrl(task.result)
                    const statusMeta =
                      STATUS_META[task.status] ?? STATUS_META.pending

                    return (
                      <Table.Row
                        className="h-16 border-b border-gray-100 transition-colors hover:bg-gray-50/60"
                        id={task.id}
                      >
                        <Table.Cell className="px-6 py-5">
                          <span className="font-mono text-sm text-gray-600">
                            {task.id.slice(0, 8)}...
                          </span>
                        </Table.Cell>
                        <Table.Cell className="px-6 py-5">
                          <Chip
                            className="px-3 py-1"
                            color={statusMeta.color}
                            size="md"
                            variant="soft"
                          >
                            {statusMeta.label}
                          </Chip>
                        </Table.Cell>
                        <Table.Cell className="px-6 py-5 text-sm text-gray-600">
                          {formatTimestamp(task.created_at)}
                        </Table.Cell>
                        <Table.Cell className="px-6 py-5">
                          {imageUrl ? (
                            <div className="flex items-center gap-3">
                              <Button
                                isIconOnly
                                aria-label="预览图片"
                                className="h-9 w-9 rounded-lg text-gray-600 transition-all duration-200 hover:bg-[#91C1FA]/10 hover:text-[#91C1FA] hover:shadow-md hover:shadow-[#91C1FA]/20 active:scale-[0.98]"
                                size="sm"
                                variant="tertiary"
                                onPress={() => onPreview(imageUrl)}
                              >
                                <ImageUp className="h-4 w-4" />
                              </Button>
                              <Button
                                isIconOnly
                                aria-label="查看原图"
                                className="h-9 w-9 rounded-lg text-gray-600 transition-all duration-200 hover:bg-[#91C1FA]/10 hover:text-[#91C1FA] hover:shadow-md hover:shadow-[#91C1FA]/20 active:scale-[0.98]"
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
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    )
                  }}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-gray-500">
            暂无生成历史
          </div>
        )}
      </Card.Content>
    </Card>
  )
}
