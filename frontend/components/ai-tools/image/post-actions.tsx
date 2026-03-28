"use client"

import { Button, Card } from "@heroui/react"
import { ExternalLink, UploadCloud } from "lucide-react"

interface PostActionsProps {
  imageUrl: string
  onUpload: () => void
  onViewOriginal: () => void
  isUploading?: boolean
}

export function PostActions({
  imageUrl,
  onUpload,
  onViewOriginal,
  isUploading = false,
}: PostActionsProps) {
  return (
    <Card className="rounded-xl border-0 bg-[#F8F8F8] shadow-none">
      <Card.Header className="border-b border-gray-200 px-5 py-4">
        <div>
          <Card.Title className="text-base font-semibold text-gray-800">
            后续操作
          </Card.Title>
          <Card.Description className="mt-1 text-sm text-gray-500">
            图片已生成完成，你可以继续查看原图或上传到营销素材库。
          </Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3 p-5">
        <Button
          className="h-11 rounded-full bg-[#91C1FA] text-white"
          isDisabled={!imageUrl}
          isPending={isUploading}
          onPress={onUpload}
        >
          <UploadCloud className="h-4 w-4" />
          上传到素材库
        </Button>
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
