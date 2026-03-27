"use client"

import { useCallback, useRef, useState } from "react"
import { ScrollShadow } from "@heroui/react"
import { Sparkles } from "lucide-react"
import {
  extractQuestionsFromContent,
  normalizeQuestionsPayload,
} from "./message-format"
import { AIMessage } from "./ai-message"
import { AppleInput } from "./apple-input"
import { ChatContainer } from "./chat-container"
import { ModeSwitcher } from "./mode-switcher"
import { ProductInfoForm } from "./product-info-form"
import { SavedContentList } from "./saved-content-list"
import { UserMessage } from "./user-message"

interface Message {
  id: string
  type: "ai" | "user"
  content: string
  tags?: string[]
  questions?: string[]
}

type ModeType = "marketing" | "guide" | "product" | "save"

function EmptyState() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#91C1FA]/10">
        <Sparkles className="h-8 w-8 text-[#91C1FA]" />
      </div>
      <p className="mb-2 text-base font-medium text-gray-800">
        输入文案需求开始创作
      </p>
      <p className="text-sm text-gray-400">
        例如：帮我写一款防晒霜的小红书文案
      </p>
    </div>
  )
}

export default function TextGenerateChat() {
  const [activeMode, setActiveMode] = useState<ModeType>("marketing")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleSend = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
    }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      const response = await fetch("/generate_xiaohongshu_stream_post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: content }),
      })

      if (!response.ok) throw new Error("请求失败")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiContent = ""
      const aiMsgId = (Date.now() + 1).toString()

      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          type: "ai",
          content: "",
          tags: [],
          questions: [],
        },
      ])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.chunk) {
                aiContent += data.chunk
                const { cleanContent, questions } =
                  extractQuestionsFromContent(aiContent)
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? {
                          ...msg,
                          content: cleanContent,
                          questions:
                            msg.questions && msg.questions.length > 0
                              ? msg.questions
                              : questions,
                        }
                      : msg
                  )
                )
              }
              if (data.done) {
                const { cleanContent, questions: parsedQuestions } =
                  extractQuestionsFromContent(aiContent)
                const normalizedQuestions = normalizeQuestionsPayload(
                  data.questions
                )
                const questions =
                  normalizedQuestions.length > 0
                    ? normalizedQuestions
                    : parsedQuestions
                const tags = data.hashtags
                  ? data.hashtags
                      .match(/#[\u4e00-\u9fa5\w]+/g)
                      ?.map((t: string) => t.slice(1)) || []
                  : []

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? { ...msg, content: cleanContent, questions, tags }
                      : msg
                  )
                )
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.error("生成失败:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content)
  }, [])

  const handleProductSubmit = useCallback(
    async (data: {
      product_name: string
      product_desc: string
      target_audience: string
    }) => {
      try {
        const response = await fetch("/api/product-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_name: data.product_name,
            product_desc: data.product_desc,
            target_audience: data.target_audience,
          }),
        })

        const result = await response.json()
        if (!response.ok || result.status !== "success") {
          throw new Error(result.message || result.error || "保存失败")
        }

        alert("产品信息已保存")
      } catch (error) {
        console.error("保存失败:", error)
        const message = error instanceof Error ? error.message : "保存失败"
        alert(message)
      }
    },
    []
  )

  const renderModeContent = () => {
    switch (activeMode) {
      case "marketing":
      case "guide":
        return (
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-hidden">
              <ScrollShadow
                ref={scrollRef}
                className="h-full overflow-y-auto px-4 md:px-6"
                hideScrollBar
              >
                {messages.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="flex flex-col gap-6 py-4">
                    {messages.map((msg, index) => (
                      <div
                        key={msg.id}
                        className={
                          msg.type === "user"
                            ? "flex justify-end"
                            : "flex justify-start"
                        }
                      >
                        {msg.type === "ai" ? (
                          <AIMessage
                            content={msg.content}
                            tags={msg.tags}
                            questions={msg.questions}
                            isStreaming={
                              index === messages.length - 1 && isLoading
                            }
                            onCopy={() => handleCopy(msg.content)}
                            onRegenerate={() =>
                              handleSend(messages[index - 1]?.content || "")
                            }
                            onQuestionClick={(q) => handleSend(q)}
                          />
                        ) : (
                          <UserMessage content={msg.content} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollShadow>
            </div>
          </div>
        )

      case "product":
        return <ProductInfoForm onSubmit={handleProductSubmit} />

      case "save":
        return <SavedContentList />

      default:
        return null
    }
  }

  const isChatMode = activeMode === "marketing" || activeMode === "guide"

  return (
    <ChatContainer
      title="文案智造器"
      modeSwitcher={
        <ModeSwitcher activeMode={activeMode} onModeChange={setActiveMode} />
      }
      inputArea={
        isChatMode ? <AppleInput onSend={handleSend} disabled={isLoading} /> : null
      }
    >
      {renderModeContent()}
    </ChatContainer>
  )
}
