"use client"

import { useEffect, useRef, useState } from "react"
import { Card, Skeleton, Spinner } from "@heroui/react"

import { cn } from "@/lib/utils"

import { EmptyState } from "./empty-state"

interface GenerationPreviewProps {
  imageUrl: string | null
  isGenerating: boolean
  imageAlt?: string
  className?: string
  emptyStateTitle?: string
  emptyStateDescription?: string
}

function PreviewSkeleton() {
  return (
    <div className="flex h-full min-h-[420px] w-full flex-col items-center justify-center gap-4 rounded-xl bg-white p-8 dark:bg-slate-900/60">
      <Skeleton className="h-full min-h-[260px] w-full rounded-2xl" />
      <div className="w-full max-w-md space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="h-4 w-1/2 rounded-full" />
      </div>
    </div>
  )
}

export function GenerationPreview({
  imageUrl,
  isGenerating,
  imageAlt = "生成结果预览",
  className,
  emptyStateTitle,
  emptyStateDescription,
}: GenerationPreviewProps) {
  const [isImageLoading, setIsImageLoading] = useState(Boolean(imageUrl))
  const previousImageUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (previousImageUrlRef.current !== imageUrl) {
      previousImageUrlRef.current = imageUrl
      setIsImageLoading(Boolean(imageUrl))
    }
  }, [imageUrl])

  const content = imageUrl ? (
    <div className="relative flex h-full min-h-[420px] items-center justify-center overflow-hidden rounded-xl bg-white p-4 dark:bg-slate-900/50">
      {isImageLoading ? <PreviewSkeleton /> : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={imageAlt}
        className={cn(
          "max-h-full max-w-full object-contain transition-opacity duration-500",
          isImageLoading ? "absolute opacity-0" : "relative opacity-100"
        )}
        loading="lazy"
        src={imageUrl}
        onLoad={() => setIsImageLoading(false)}
      />

      {isGenerating ? (
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm text-gray-700 shadow-lg backdrop-blur-sm dark:bg-slate-800/95 dark:text-slate-200">
            <Spinner color="accent" size="sm" />
            正在生成新图片
          </div>
        </div>
      ) : null}
    </div>
  ) : (
    <EmptyState
      description={emptyStateDescription}
      title={emptyStateTitle}
    />
  )

  return (
    <Card
      className={cn(
        "h-full rounded-xl border-0 bg-[#F8F8F8] shadow-none dark:bg-slate-900/90 dark:ring-1 dark:ring-white/10",
        className
      )}
    >
      <Card.Header className="border-b border-gray-200 px-5 py-4 dark:border-slate-700">
        <div>
          <Card.Title className="text-base font-semibold text-gray-800 dark:text-slate-100">
            图像生成预览区
          </Card.Title>
          <Card.Description className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            生成完成后可直接预览、查看原图或上传到素材库。
          </Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="p-4">{content}</Card.Content>
    </Card>
  )
}
