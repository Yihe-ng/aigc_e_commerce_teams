"use client"

import { Card } from "@heroui/react"
import { ImageIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title?: string
  description?: string
  className?: string
}

const DEFAULT_TITLE = "等待选择商品主图"
const DEFAULT_DESCRIPTION =
  "完成商品分类和商品选择后，这里会展示主图预览或生成结果。"

export function EmptyState({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "flex min-h-[420px] items-center justify-center border-0 bg-transparent shadow-none",
        className
      )}
      variant="transparent"
    >
      <Card.Content className="flex max-w-sm flex-col items-center gap-4 px-6 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#91C1FA]/10 text-[#91C1FA]">
          <ImageIcon className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm leading-6 text-gray-500">{description}</p>
        </div>
      </Card.Content>
    </Card>
  )
}
