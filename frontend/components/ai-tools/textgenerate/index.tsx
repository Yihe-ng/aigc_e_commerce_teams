"use client"

import { startTransition, useCallback, useEffect, useRef, useState } from "react"
import { ScrollShadow } from "@heroui/react"
import { Sparkles } from "lucide-react"
import { fetchProductLibrary } from "@/lib/oss/api"
import type { Product } from "@/lib/types/product"

import {
  extractQuestionsFromContent,
  normalizeQuestionsPayload,
} from "./message-format"
import { AIMessage } from "./ai-message"
import { AppleInput } from "./apple-input"
import { ChatContainer } from "./chat-container"
import { ModeSwitcher } from "./mode-switcher"
import { ProductInfoForm } from "./product-info-form"
import { SaveDraftPanel, type SaveDraftValue } from "./save-draft-panel"
import { SavedContentList } from "./saved-content-list"
import { UserMessage } from "./user-message"

interface Message {
  id: string
  type: "ai" | "user"
  content: string
  tags?: string[]
  questions?: string[]
  isError?: boolean
}

type ModeType = "marketing" | "guide" | "product" | "save"

// 将错误处理函数提取到组件外部，避免每次请求时重复创建
const normalizeStreamError = (rawMessage: unknown) => {
  const message = String(rawMessage || "").trim().toLowerCase()

  if (!message) {
    return "生成失败：服务响应超时或未返回内容，请稍后重试。"
  }
  if (
    message.includes("connection aborted") ||
    message.includes("connection reset") ||
    message.includes("connectionreseterror") ||
    message.includes("10054") ||
    message.includes("远程主机强迫关闭了一个现有的连接")
  ) {
    return "生成失败：服务连接中断，请稍后重试。"
  }
  if (
    message.includes("read timed out") ||
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("超时")
  ) {
    return "生成失败：服务响应超时，请稍后重试。"
  }
  if (
    message.includes("api key") ||
    message.includes("未配置") ||
    message.includes("not configured")
  ) {
    return "生成失败：服务配置异常，请稍后再试。"
  }
  if (
    message.includes("api error") ||
    message.includes("status code") ||
    message.includes("bad gateway") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504")
  ) {
    return "生成失败：服务暂时不可用，请稍后重试。"
  }

  return "生成失败：请稍后重试。"
}

function EmptyState() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#91C1FA]/10 dark:bg-sky-500/10">
        <Sparkles className="h-8 w-8 text-[#91C1FA] dark:text-sky-400" />
      </div>
      <p className="mb-2 text-base font-medium text-gray-800 dark:text-slate-200">
        输入文案需求开始创作
      </p>
      <p className="text-sm text-gray-400 dark:text-slate-500">
        例如：帮我写一款防晒霜的小红书营销文案
      </p>
    </div>
  )
}

export default function TextGenerateChat() {
  const [activeMode, setActiveMode] = useState<ModeType>("marketing")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [savedContentsRefreshKey, setSavedContentsRefreshKey] = useState(0)
  const [products, setProducts] = useState<Product[]>([])
  const [saveDraft, setSaveDraft] = useState<SaveDraftValue>({
    product_id: null,
    product_name: "",
    copy_type: "marketing",
    ad_best: "",
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  // 滚动锚点 ref，用于自动滚动到底部
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const activeRequestIdRef = useRef(0)

  // 自动滚动到底部的函数
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  // 消息变化时自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [messages.length, scrollToBottom])

  // 流式输出时跟随滚动
  const lastMessage = messages[messages.length - 1]
  const isLastMessageStreaming = lastMessage?.type === "ai" && isLoading

  useEffect(() => {
    if (isLastMessageStreaming && lastMessage?.content) {
      scrollToBottom("auto")
    }
  }, [isLastMessageStreaming, lastMessage?.content, scrollToBottom])

  // AI 响应完成时滚动到底部（适用于单 chunk 整块返回）
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [isLoading, messages.length, scrollToBottom])

  const handleSend = useCallback(async (content: unknown) => {
    if (typeof content !== "string") {
      return
    }

    const normalizedContent = content.trim()
    if (!normalizedContent || isLoading) {
      return
    }

    const requestId = activeRequestIdRef.current + 1
    activeRequestIdRef.current = requestId
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content: normalizedContent,
    }
    const aiMsgId = `${Date.now() + 1}`

    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        id: aiMsgId,
        type: "ai",
        content: "",
        tags: [],
        questions: [],
        isError: false,
      },
    ])
    setIsLoading(true)

    try {
      const isGuideMode = activeMode === "guide"
      const requestBody: { query: string; mode?: string; platform?: string } = {
        query: normalizedContent,
        mode: isGuideMode ? "guide" : "marketing",
      }

      if (!isGuideMode) {
        requestBody.platform = "auto"
      }

      const updateAiMessage = (updater: (message: Message) => Message) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMsgId ? updater(msg) : msg))
        )
      }

      // 使用组件外部定义的 normalizeStreamError 函数
      const applyStreamError = (rawMessage: unknown) => {
        const message = normalizeStreamError(rawMessage)

        updateAiMessage((msg) => ({
          ...msg,
          content: message,
          tags: [],
          questions: [],
          isError: true,
        }))
      }

      const response = await fetch("/generate_xiaohongshu_stream_post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error("请求失败，请稍后重试。")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("响应流不可用。")
      }

      const decoder = new TextDecoder()
      let aiContent = ""
      let pendingSseBuffer = ""
      let sawRenderableChunk = false
      let streamFailed = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        if (activeRequestIdRef.current !== requestId) {
          await reader.cancel()
          break
        }

        pendingSseBuffer += decoder.decode(value, { stream: true })
        const lines = pendingSseBuffer.split("\n")
        pendingSseBuffer = lines.pop() ?? ""

        for (const rawLine of lines) {
          const line = rawLine.trim()
          if (!line.startsWith("data: ")) {
            continue
          }

          try {
            const data = JSON.parse(line.slice(6))

            if (data.chunk) {
              sawRenderableChunk = true
              aiContent += data.chunk
              const { questions } = extractQuestionsFromContent(aiContent)

              updateAiMessage((msg) => ({
                ...msg,
                content: aiContent,
                questions:
                  msg.questions && msg.questions.length > 0
                    ? msg.questions
                    : questions,
                isError: false,
              }))
            }

            if (data.error) {
              streamFailed = true
              applyStreamError(data.error)
              await reader.cancel()
              break
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
                    ?.map((tag: string) => tag.slice(1)) || []
                : []

              if (!sawRenderableChunk && !cleanContent.trim()) {
                streamFailed = true
                applyStreamError("生成失败：上游未返回可显示内容，请稍后重试。")
              } else {
                updateAiMessage((msg) => ({
                  ...msg,
                  content: cleanContent,
                  questions,
                  tags,
                  isError: false,
                }))
              }
            }
          } catch {
            // Ignore incomplete SSE frames and wait for the next buffered chunk.
          }
        }

        if (streamFailed) {
          break
        }
      }

      const trailingLine = pendingSseBuffer.trim()
      if (!streamFailed && trailingLine.startsWith("data: ")) {
        try {
          const data = JSON.parse(trailingLine.slice(6))
          if (data.error) {
            streamFailed = true
            applyStreamError(data.error)
          }
        } catch {
          // Ignore an incomplete trailing SSE frame.
        }
      }

      if (!streamFailed && !sawRenderableChunk) {
        applyStreamError("生成失败：上游响应超时或未返回内容，请稍后重试。")
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      console.error("生成失败:", error)
      const message =
        error instanceof Error ? error.message : "生成失败：请求异常，请稍后重试。"
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? {
                ...msg,
                content: message,
                tags: [],
                questions: [],
                isError: true,
              }
            : msg
        )
      )
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsLoading(false)
      }
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }, [isLoading, activeMode])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    setIsLoadingProducts(true)
    fetchProductLibrary(controller.signal)
      .then((items) => {
        setProducts(items)
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        console.error("加载商品列表失败:", error)
        setProducts([])
      })
      .finally(() => {
        setIsLoadingProducts(false)
      })

    return () => controller.abort()
  }, [])

  const handleCopy = useCallback((content: unknown) => {
    if (typeof content !== "string") {
      return
    }
    void navigator.clipboard.writeText(content)
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

        startTransition(() => {
          setSaveDraft((current) => ({
            ...current,
            product_name: data.product_name,
          }))
        })

        alert("产品信息已保存")
      } catch (error) {
        console.error("保存失败:", error)
        const message = error instanceof Error ? error.message : "保存失败"
        alert(message)
      }
    },
    []
  )

  const handleAdopt = useCallback(
    (content: unknown, copyType: SaveDraftValue["copy_type"]) => {
      if (typeof content !== "string") {
        return
      }
      startTransition(() => {
        setSaveDraft((current) => ({
          ...current,
          copy_type: copyType,
          ad_best: content,
        }))
        setActiveMode("save")
      })
    },
    []
  )

  const handleSaveDraftChange = useCallback((value: SaveDraftValue) => {
    setSaveDraft(value)
  }, [])

  const handleSaveDraft = useCallback(async () => {
    const payload = {
      product_id: saveDraft.product_id,
      product_name: saveDraft.product_name.trim(),
      ad_best: saveDraft.ad_best.trim(),
      copy_type: saveDraft.copy_type,
    }
    const hasSelectedProduct = products.some(
      (product) => product.id === payload.product_id
    )

    if (!payload.product_id || !payload.product_name || !payload.ad_best) {
      alert("请先完善商品名称和最终文案")
      return
    }

    if (!hasSelectedProduct) {
      alert("请选择商品库中已有的商品")
      return
    }

    setIsSavingDraft(true)

    try {
      const response = await fetch("/submit-form-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || result.error || "保存失败")
      }

      setSavedContentsRefreshKey((current) => current + 1)
      alert("最佳方案已保存到商品营销素材库")
    } catch (error) {
      console.error("保存失败:", error)
      const message = error instanceof Error ? error.message : "保存失败"
      alert(message)
    } finally {
      setIsSavingDraft(false)
    }
  }, [products, saveDraft])

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
                            interactionsDisabled={isLoading}
                            onCopy={() => handleCopy(msg.content)}
                            onRegenerate={() =>
                              handleSend(messages[index - 1]?.content || "")
                            }
                            onQuestionClick={(question) => handleSend(question)}
                            onAdopt={
                              msg.isError
                                ? undefined
                                : (messageContent) =>
                                    handleAdopt(
                                      messageContent,
                                      activeMode === "guide"
                                        ? "guide"
                                        : "marketing"
                                    )
                            }
                          />
                        ) : (
                          <UserMessage content={msg.content} />
                        )}
                      </div>
                    ))}
                    {/* 滚动锚点，用于自动定位到底部 */}
                    <div ref={messagesEndRef} aria-hidden="true" />
                  </div>
                )}
              </ScrollShadow>
            </div>
          </div>
        )

      case "product":
        return <ProductInfoForm onSubmit={handleProductSubmit} />

      case "save":
        return (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
              <SaveDraftPanel
                value={saveDraft}
                products={products}
                isLoadingProducts={isLoadingProducts}
                isSaving={isSavingDraft}
                onChange={handleSaveDraftChange}
                onSave={handleSaveDraft}
              />
              <SavedContentList refreshKey={savedContentsRefreshKey} />
            </div>
          </div>
        )

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
        isChatMode ? (
          <AppleInput onSend={handleSend} disabled={isLoading} />
        ) : null
      }
    >
      {renderModeContent()}
    </ChatContainer>
  )
}
