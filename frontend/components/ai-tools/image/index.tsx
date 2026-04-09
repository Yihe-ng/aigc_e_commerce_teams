"use client"

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Card, Toast, toast } from "@heroui/react"
import { buildOssAssetUrl, isAbsoluteUrl, resolveOssCustomDomain } from "@/lib/oss/shared"
import { fetchFallbackCategories, fetchFallbackProductsByCategory } from "@/lib/products/oss-fallback"

import { GenerationHistory } from "./generation-history"
import { GenerationPreview } from "./generation-preview"
import { GenerationProgress } from "./generation-progress"
import { PostActions } from "./post-actions"
import { ProductSelector } from "./product-selector"
import type {
  CategoriesResponse,
  GenerateImageResponse,
  GenerationResult,
  GenerationTask,
  ProductsResponse,
  RuntimeImageConfigResponse,
  SaveGeneratedContentResponse,
  TaskHistoryResponse,
  TaskStatusResponse,
} from "./types"

const HISTORY_REFRESH_MS = 5000
const POLL_INTERVAL_MS = 2000
const ELAPSED_TIME_INTERVAL_MS = 1000
const PROGRESS_SIMULATION_INTERVAL_MS = 400
const LEGACY_HISTORY_UPLOAD_DISABLED_REASON =
  "旧记录缺少归属商品信息，无法安全上传，请重新生成后再上传。"


function parseGenerationResult(
  result: GenerationTask["result"]
): GenerationResult | null {
  if (!result) {
    return null
  }

  if (typeof result === "string") {
    try {
      return JSON.parse(result) as GenerationResult
    } catch {
      return null
    }
  }

  return result
}

function extractTaskImageUrl(result: GenerationTask["result"]): string | null {
  return parseGenerationResult(result)?.image_url ?? null
}

function extractTaskProductId(
  result: GenerationTask["result"]
): string | null {
  const productId = parseGenerationResult(result)?.product_id

  return typeof productId === "string" && productId.trim()
    ? productId.trim()
    : null
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

async function readJson<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  const payload = (await response.json()) as T & {
    error?: string
    msg?: string
    message?: string
  }

  if (!response.ok) {
    throw new Error(
      payload.error ?? payload.msg ?? payload.message ?? fallbackMessage
    )
  }

  return payload
}

export default function ImageGenerator() {
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [products, setProducts] = useState<ProductsResponse["data"]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  )
  const [runtimeOssDomain, setRuntimeOssDomain] = useState<string | null>(null)
  const [runtimeConfigError, setRuntimeConfigError] = useState<string | null>(
    null
  )
  const [isLoadingRuntimeConfig, setIsLoadingRuntimeConfig] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [statusText, setStatusText] = useState("等待开始")
  const [taskId, setTaskId] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [history, setHistory] = useState<GenerationTask[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(
    null
  )
  const [previewSourceProductId, setPreviewSourceProductId] = useState<
    string | null
  >(null)

  const pollingRef = useRef<number | null>(null)
  const progressTimerRef = useRef<number | null>(null)
  const historyTimerRef = useRef<number | null>(null)
  const elapsedTimerRef = useRef<number | null>(null)
  const isFetchingHistoryRef = useRef(false)
  const isPollingTaskRef = useRef(false)

  const productMap = useMemo(() => {
    const map = new Map<string, NonNullable<ProductsResponse["data"]>[number]>()

    for (const product of products ?? []) {
      map.set(product.product_id, product)
    }

    return map
  }, [products])

  const selectedProduct = useMemo(
    () =>
      selectedProductId ? productMap.get(selectedProductId) ?? null : null,
    [productMap, selectedProductId]
  )

  const resolvedOssCustomDomain = useMemo(() => {
    return resolveOssCustomDomain(runtimeOssDomain)
  }, [runtimeOssDomain])

  const selectedProductImageUrl = useMemo(
    () => buildOssAssetUrl(selectedProduct?.main_image, resolvedOssCustomDomain),
    [resolvedOssCustomDomain, selectedProduct]
  )

  const previewImageUrl = useMemo(() => {
    return generatedImage ?? selectedProductImageUrl
  }, [generatedImage, selectedProductImageUrl])

  const hasRelativeSelectedImage = useMemo(() => {
    return Boolean(
      selectedProduct?.main_image &&
        !isAbsoluteUrl(selectedProduct.main_image)
    )
  }, [selectedProduct])

  const hasBlockingConfigIssue = useMemo(() => {
    return (
      hasRelativeSelectedImage &&
      !selectedProductImageUrl &&
      !isLoadingRuntimeConfig
    )
  }, [hasRelativeSelectedImage, isLoadingRuntimeConfig, selectedProductImageUrl])

  const generateDisabledReason = useMemo(() => {
    if (isLoadingRuntimeConfig) {
      return "正在加载图片配置"
    }

    if (!selectedProduct) {
      return "请先选择商品"
    }

    if (!selectedProduct.main_image) {
      return "当前商品缺少主图"
    }

    if (hasBlockingConfigIssue) {
      return runtimeConfigError
        ? "图片配置加载失败，暂时无法解析商品主图"
        : "未获取到 OSS 域名配置，暂时无法解析商品主图"
    }

    return null
  }, [
    hasBlockingConfigIssue,
    isLoadingRuntimeConfig,
    runtimeConfigError,
    selectedProduct,
  ])

  const previewDescription = useMemo(() => {
    if (selectedProductImageUrl) {
      return null
    }

    if (isLoadingRuntimeConfig) {
      return "正在加载图片配置，稍后会自动显示商品主图。"
    }

    if (selectedProduct && !selectedProduct.main_image) {
      return "当前商品没有配置主图，请选择其他商品。"
    }

    if (hasBlockingConfigIssue) {
      return runtimeConfigError
        ? "图片配置加载失败，暂时无法解析商品主图，请稍后重试。"
        : "未获取到 OSS 域名配置，暂时无法解析商品主图。"
    }

    if (selectedCategory) {
      return "选择具体商品后，这里会显示主图预览。"
    }

    return "先选择商品分类和商品。"
  }, [
    hasBlockingConfigIssue,
    isLoadingRuntimeConfig,
    runtimeConfigError,
    selectedCategory,
    selectedProduct,
    selectedProductImageUrl,
  ])

  const canGenerate = useMemo(() => {
    return Boolean(
      selectedProduct &&
        selectedProductImageUrl &&
        !isGenerating &&
        !isLoadingRuntimeConfig
    )
  }, [
    isGenerating,
    isLoadingRuntimeConfig,
    selectedProduct,
    selectedProductImageUrl,
  ])

  const uploadDisabledReason = useMemo(() => {
    if (!generatedImage) {
      return null
    }

    if (!previewSourceProductId) {
      return LEGACY_HISTORY_UPLOAD_DISABLED_REASON
    }

    return null
  }, [generatedImage, previewSourceProductId])

  const clearPolling = useCallback((): void => {
    if (pollingRef.current !== null) {
      window.clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const clearProgressTimer = useCallback((): void => {
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }, [])

  const stopGeneration = useCallback((): void => {
    setIsGenerating(false)
    clearPolling()
    clearProgressTimer()
  }, [clearPolling, clearProgressTimer])

  const fetchRuntimeConfig = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      setIsLoadingRuntimeConfig(true)

      try {
        const response = await fetch("/api/runtime-config/image", { signal })
        const payload = await readJson<RuntimeImageConfigResponse>(
          response,
          "获取图片配置失败"
        )

        startTransition(() => {
          setRuntimeOssDomain(payload.data?.oss_custom_domain?.trim() || null)
          setRuntimeConfigError(null)
        })
      } catch (error) {
        if (isAbortError(error)) {
          return
        }
        const message = getErrorMessage(error, "获取图片配置失败")
        startTransition(() => {
          setRuntimeOssDomain(null)
          setRuntimeConfigError(message)
          setStatusText((current) =>
            current === "等待开始" ? "图片配置加载失败" : current
          )
        })
      } finally {
        setIsLoadingRuntimeConfig(false)
      }
    },
    []
  )

  const fetchHistory = useCallback(async (signal?: AbortSignal): Promise<void> => {
    if (isFetchingHistoryRef.current) {
      return
    }

    isFetchingHistoryRef.current = true

    try {
      const response = await fetch("/api/tasks/image", { signal })
      const payload = await readJson<TaskHistoryResponse>(
        response,
        "获取生成历史失败"
      )

      startTransition(() => {
        setHistory(payload.tasks ?? [])
      })
    } finally {
      isFetchingHistoryRef.current = false
    }
  }, [])

  const fetchCategories = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      setIsLoadingCategories(true)

      try {
        const response = await fetch("/api/oss/categories", { signal })
        const payload = await readJson<CategoriesResponse>(
          response,
          "获取分类失败"
        )

        if (payload.status !== "success" && payload.code !== 200) {
          throw new Error(payload.error ?? payload.message ?? "获取分类失败")
        }

        startTransition(() => {
          setCategories(payload.data ?? [])
        })
      } catch (error) {
        if (isAbortError(error)) {
          return
        }

        const fallbackCategories = await fetchFallbackCategories(signal)
        startTransition(() => {
          setCategories(fallbackCategories)
        })
      } finally {
        setIsLoadingCategories(false)
      }
    },
    []
  )

  const fetchProductsByCategory = useCallback(
    async (category: string, signal?: AbortSignal): Promise<void> => {
      if (!category) {
        startTransition(() => {
          setProducts([])
          setSelectedProductId(null)
        })
        return
      }

      setIsLoadingProducts(true)

      try {
        const params = new URLSearchParams({ category })
        const response = await fetch(
          `/api/oss/products_by_category?${params.toString()}`,
          { signal }
        )
        const payload = await readJson<ProductsResponse>(
          response,
          "获取商品失败"
        )

        if (payload.status !== "success") {
          throw new Error(payload.error ?? payload.message ?? "获取商品失败")
        }

        startTransition(() => {
          setProducts(payload.data ?? [])
        })
      } catch (error) {
        if (isAbortError(error)) {
          return
        }

        const fallbackProducts = await fetchFallbackProductsByCategory(category, signal)
        startTransition(() => {
          setProducts(fallbackProducts)
        })
      } finally {
        setIsLoadingProducts(false)
      }
    },
    []
  )

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      fetchRuntimeConfig(controller.signal),
      fetchCategories(controller.signal),
      fetchHistory(controller.signal),
    ]).catch((error) => {
      if (isAbortError(error)) {
        return
      }
      const message = getErrorMessage(error, "初始化数据加载失败")
      toast.danger(message)
      setStatusText(message)
    })

    return () => controller.abort()
  }, [fetchCategories, fetchHistory, fetchRuntimeConfig])

  useEffect(() => {
    const controller = new AbortController()

    if (selectedCategory) {
      fetchProductsByCategory(selectedCategory, controller.signal).catch(
        (error) => {
          if (isAbortError(error)) {
            return
          }
          const message = getErrorMessage(error, "获取商品失败")
          toast.danger(message)
          setStatusText(message)
        }
      )
    } else {
      startTransition(() => {
        setProducts([])
        setSelectedProductId(null)
      })
    }

    return () => controller.abort()
  }, [fetchProductsByCategory, selectedCategory])

  useEffect(() => {
    const controller = new AbortController()

    historyTimerRef.current = window.setInterval(() => {
      fetchHistory(controller.signal).catch(() => {
        // Ignore transient polling failures.
      })
    }, HISTORY_REFRESH_MS)

    return () => {
      controller.abort()
      if (historyTimerRef.current !== null) {
        window.clearInterval(historyTimerRef.current)
        historyTimerRef.current = null
      }
    }
  }, [fetchHistory])

  useEffect(() => {
    if (!isGenerating || generationStartedAt === null) {
      if (elapsedTimerRef.current !== null) {
        window.clearInterval(elapsedTimerRef.current)
        elapsedTimerRef.current = null
      }
      return
    }

    elapsedTimerRef.current = window.setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - generationStartedAt) / 1000))
    }, ELAPSED_TIME_INTERVAL_MS)

    return () => {
      if (elapsedTimerRef.current !== null) {
        window.clearInterval(elapsedTimerRef.current)
        elapsedTimerRef.current = null
      }
    }
  }, [generationStartedAt, isGenerating])

  useEffect(() => {
    return () => {
      clearPolling()
      clearProgressTimer()
      if (historyTimerRef.current !== null) {
        window.clearInterval(historyTimerRef.current)
      }
      if (elapsedTimerRef.current !== null) {
        window.clearInterval(elapsedTimerRef.current)
      }
    }
  }, [clearPolling, clearProgressTimer])

  const startProgressSimulation = useCallback((): void => {
    clearProgressTimer()

    progressTimerRef.current = window.setInterval(() => {
      setProgress((previousProgress) => {
        if (previousProgress >= 90) {
          clearProgressTimer()
          return 90
        }

        const increment =
          previousProgress < 50 ? 5 : previousProgress < 75 ? 3 : 1

        return Math.min(previousProgress + increment, 90)
      })
    }, PROGRESS_SIMULATION_INTERVAL_MS)
  }, [clearProgressTimer])

  const pollTaskStatus = useCallback(
    (nextTaskId: string): void => {
      clearPolling()
      isPollingTaskRef.current = false

      pollingRef.current = window.setInterval(async () => {
        if (isPollingTaskRef.current) {
          return
        }

        isPollingTaskRef.current = true

        try {
          const response = await fetch(`/api/check_task_status/${nextTaskId}`)
          const payload = await readJson<TaskStatusResponse>(
            response,
            "查询任务状态失败"
          )
          const currentTask = payload.task

          if (!currentTask) {
            throw new Error("任务状态不存在")
          }

          if (currentTask.status === "completed") {
            const nextImageUrl = extractTaskImageUrl(currentTask.result)
            const nextProductId =
              extractTaskProductId(currentTask.result) ?? selectedProductId

            setProgress(100)
            setStatusText("生成完成")
            setGeneratedImage(nextImageUrl)
            setPreviewSourceProductId(nextProductId)
            setGenerationStartedAt(null)
            stopGeneration()
            setTaskId(null)
            void fetchHistory()
            toast.success("营销图生成成功")
            return
          }

          if (currentTask.status === "failed") {
            const errorMessage = currentTask.error ?? "任务执行失败"
            setProgress(100)
            setStatusText(errorMessage)
            setGenerationStartedAt(null)
            stopGeneration()
            setTaskId(null)
            void fetchHistory()
            toast.danger(errorMessage)
            return
          }

          setStatusText("AI 正在生成中...")
        } catch (error) {
          const message = getErrorMessage(error, "查询任务状态失败")
          stopGeneration()
          setTaskId(null)
          setGenerationStartedAt(null)
          setStatusText(message)
          toast.danger(message)
        } finally {
          isPollingTaskRef.current = false
        }
      }, POLL_INTERVAL_MS)
    },
    [clearPolling, fetchHistory, selectedProductId, stopGeneration]
  )

  const handleCategoryChange = useCallback((category: string): void => {
    startTransition(() => {
      setSelectedCategory(category)
      setSelectedProductId(null)
      setGeneratedImage(null)
      setPreviewSourceProductId(null)
      setTaskId(null)
    })
  }, [])

  const handleProductChange = useCallback((productId: string | null): void => {
    startTransition(() => {
      setSelectedProductId(productId)
      setGeneratedImage(null)
      setPreviewSourceProductId(null)
      setTaskId(null)
    })
  }, [])

  const handleGenerate = useCallback(async (): Promise<void> => {
    if (isGenerating) {
      return
    }

    if (!selectedProductImageUrl || !selectedProductId) {
      toast.warning(generateDisabledReason ?? "请先选择可用商品主图")
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setElapsedTime(0)
    setStatusText("任务提交中...")
    setGeneratedImage(null)
    setPreviewSourceProductId(null)
    setGenerationStartedAt(Date.now())

    try {
      const response = await fetch("/api/generate_img2img", {
        body: JSON.stringify({
          image_url: selectedProductImageUrl,
          product_id: selectedProductId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const payload = await readJson<GenerateImageResponse>(
        response,
        "提交生成任务失败"
      )

      if (payload.code !== 0 || !payload.data?.task_id) {
        throw new Error(payload.msg || "提交生成任务失败")
      }

      setTaskId(payload.data.task_id)
      setStatusText("任务已提交，后台生成中...")
      startProgressSimulation()
      pollTaskStatus(payload.data.task_id)
      void fetchHistory()
    } catch (error) {
      const message = getErrorMessage(error, "提交生成任务失败")
      stopGeneration()
      setGenerationStartedAt(null)
      setStatusText(message)
      toast.danger(message)
    }
  }, [
    fetchHistory,
    generateDisabledReason,
    isGenerating,
    pollTaskStatus,
    selectedProductId,
    selectedProductImageUrl,
    startProgressSimulation,
    stopGeneration,
  ])

  const handleUpload = useCallback(async (): Promise<void> => {
    if (!generatedImage) {
      toast.warning("请先生成或预览图片")
      return
    }

    if (!previewSourceProductId) {
      toast.warning(LEGACY_HISTORY_UPLOAD_DISABLED_REASON)
      return
    }

    setIsUploading(true)

    try {
      const response = await fetch("/api/save_generated_content", {
        body: JSON.stringify({
          file_url: generatedImage,
          metadata: {
            generated_at: new Date().toISOString(),
            task_id: taskId,
          },
          product_id: previewSourceProductId,
          type: "image",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const payload = await readJson<SaveGeneratedContentResponse>(
        response,
        "上传生成内容失败"
      )

      if (payload.status !== "success") {
        throw new Error(payload.error ?? "上传生成内容失败")
      }

      toast.success("图片已上传到素材库")
    } catch (error) {
      toast.danger(getErrorMessage(error, "上传生成内容失败"))
    } finally {
      setIsUploading(false)
    }
  }, [generatedImage, previewSourceProductId, taskId])

  const handleViewImage = useCallback((imageUrl: string): void => {
    window.open(imageUrl, "_blank", "noopener,noreferrer")
  }, [])

  const handleViewOriginal = useCallback((): void => {
    if (!generatedImage) {
      return
    }

    handleViewImage(generatedImage)
  }, [generatedImage, handleViewImage])

  const handlePreviewHistory = useCallback((task: GenerationTask): void => {
    const imageUrl = extractTaskImageUrl(task.result)

    if (!imageUrl) {
      toast.warning("该历史记录没有可预览的图片")
      return
    }

    setGeneratedImage(imageUrl)
    setPreviewSourceProductId(extractTaskProductId(task.result))
    setTaskId(task.id)
  }, [])

  const hasProgressPanel = isGenerating || progress > 0
  const hasPostActions = Boolean(generatedImage)

  return (
    <>
      <Toast.Provider placement="bottom end" />
      <Card className="w-full rounded-2xl border-0 bg-[#EFEFEF] shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:bg-slate-900/85 dark:shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
        <Card.Header className="border-b border-gray-200 px-6 py-2.5 dark:border-slate-700">
          <div>
            <Card.Title className="text-lg font-semibold text-gray-800 dark:text-slate-100">
              营销图创作
            </Card.Title>
            <Card.Description className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              AI 驱动的商品营销图生成工具
            </Card.Description>
          </div>
        </Card.Header>
        <Card.Content className="space-y-4 px-6 pb-6 pt-2.5">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(360px,5fr)]">
            <GenerationPreview
              emptyStateDescription={previewDescription ?? undefined}
              emptyStateTitle="等待预览商品主图"
              imageAlt={selectedProduct?.name ?? "营销图预览"}
              imageUrl={previewImageUrl}
              isGenerating={isGenerating}
            />

            <div className="space-y-6">
              <ProductSelector
                canGenerate={canGenerate}
                categories={categories}
                generateDisabledReason={generateDisabledReason ?? undefined}
                isGenerating={isGenerating}
                isLoadingCategories={isLoadingCategories}
                isLoadingProducts={isLoadingProducts}
                isLoadingRuntimeConfig={isLoadingRuntimeConfig}
                previewImageUrl={selectedProductImageUrl}
                previewPlaceholder={previewDescription ?? undefined}
                products={products ?? []}
                selectedCategory={selectedCategory}
                selectedProduct={selectedProduct}
                onCategoryChange={handleCategoryChange}
                onGenerate={handleGenerate}
                onProductChange={handleProductChange}
              />

              {hasProgressPanel ? (
                <GenerationProgress
                  elapsedTime={elapsedTime}
                  progress={progress}
                  statusText={statusText}
                />
              ) : null}

              {hasPostActions && generatedImage ? (
                <PostActions
                  imageUrl={generatedImage}
                  isUploading={isUploading}
                  uploadDisabledReason={uploadDisabledReason}
                  onUpload={handleUpload}
                  onViewOriginal={handleViewOriginal}
                />
              ) : null}
            </div>
          </div>

          <GenerationHistory
            tasks={history}
            onPreview={handlePreviewHistory}
            onView={handleViewImage}
          />
        </Card.Content>
      </Card>
    </>
  )
}
