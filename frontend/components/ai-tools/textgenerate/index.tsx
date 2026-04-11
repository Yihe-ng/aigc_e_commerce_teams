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
}

type ModeType = "marketing" | "guide" | "product" | "save"

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
  const abortControllerRef = useRef<AbortController | null>(null)
  const activeRequestIdRef = useRef(0)

  const handleSend = useCallback(async (content: unknown) => {
    /** HeroUI/React Aria 的 onPress 可能传入 PressEvent；若当字符串用会触发异常或产生 "[object Event]" */
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
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)

    try {
      // 根据当前模式选择请求参数
      const isGuideMode = activeMode === "guide"
      const requestBody: { query: string; mode?: string; platform?: string } = {
        query: normalizedContent,
        mode: isGuideMode ? "guide" : "marketing",
      }

      // 营销文案模式下可以指定平台，guide模式下不需要
      if (!isGuideMode) {
        requestBody.platform = "auto" // 后续可以扩展让用户选择平台
      }

      const response = await fetch("/generate_xiaohongshu_stream_post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error("请求失败")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("响应流不可用")
      }
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

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        if (activeRequestIdRef.current !== requestId) {
          await reader.cancel()
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (!line.startsWith("data: ")) {
            continue
          }

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
                    ?.map((tag: string) => tag.slice(1)) || []
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
            // Ignore transient stream parsing errors.
          }
        }
      }
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return
      }

      console.error("生成失败:", error)
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsLoading(false)
      }
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }, [isLoading, activeMode])  // 添加 activeMode 依赖，确保模式切换时更新请求

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
    // 使用 product_id 进行匹配，避免同名商品导致的错误匹配
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
      alert("最终方案已保存到商品营销素材库")
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
                            onAdopt={(content) =>
                              handleAdopt(
                                content,
                                activeMode === "guide" ? "guide" : "marketing"
                              )
                            }
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
        return (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
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
