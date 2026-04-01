"use client"

import { Card } from "@heroui/react"
import { getUserMessageBubbleClassName } from "./message-format"

interface UserMessageProps {
  content: string
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <Card className={getUserMessageBubbleClassName()}>
        <Card.Content className="p-4">
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}
