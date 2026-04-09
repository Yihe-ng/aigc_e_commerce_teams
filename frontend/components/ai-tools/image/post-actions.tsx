"use client"

import { Button, Card } from "@heroui/react"
import { ExternalLink, UploadCloud } from "lucide-react"

interface PostActionsProps {
  imageUrl: string
  onUpload: () => void
  onViewOriginal: () => void
  isUploading?: boolean
  uploadDisabledReason?: string | null
}

export function PostActions({
  imageUrl,
  onUpload,
  onViewOriginal,
  isUploading = false,
  uploadDisabledReason,
}: PostActionsProps) {
  const isUploadDisabled = !imageUrl || Boolean(uploadDisabledReason)

  return (
    <Card className="rounded-xl border-0 bg-[#F8F8F8] shadow-none dark:bg-slate-900/90 dark:ring-1 dark:ring-white/10">
      <Card.Header className="border-b border-gray-200 px-5 py-4 dark:border-slate-700">
        <div>
          <Card.Title className="text-base font-semibold text-gray-800 dark:text-slate-100">
            后续操作
          </Card.Title>
          <Card.Description className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            图片生成完成后，你可以查看原图，或在归属商品明确时上传到营销素材库。
          </Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3 p-5">
        <Button
          className="h-11 rounded-full bg-[#91C1FA] text-white"
          isDisabled={isUploadDisabled}
          isPending={isUploading}
          onPress={onUpload}
        >
          <UploadCloud className="h-4 w-4" />
          上传到素材库
        </Button>
        {uploadDisabledReason ? (
          <p className="rounded-xl bg-white px-4 py-3 text-sm text-gray-500 shadow-sm dark:bg-slate-800/80 dark:text-slate-300">
            {uploadDisabledReason}
          </p>
        ) : null}
        <Button
          className="h-11 rounded-full"
          isDisabled={!imageUrl}
          variant="secondary"
          onPress={onViewOriginal}
        >
          <ExternalLink className="h-4 w-4" />
          查看原图
        </Button>
      </Card.Content>
    </Card>
  )
}
