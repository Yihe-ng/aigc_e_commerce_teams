"use client"

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  Button,
  Card,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
  Toast,
  toast,
} from "@heroui/react"
import { FolderTree, Package2, Sparkles } from "lucide-react"
import { fetchFallbackCategories, fetchFallbackProductsByCategory } from "@/lib/products/oss-fallback"

import { GenerationProgress } from "@/components/ai-tools/common/generation-progress"

import { VideoGenerationArea } from "./video-generation-area"
import { VideoGenerationHistory } from "./video-generation-history"
import type {
  CategoriesResponse,
  GenerateVideoResponse,
  Product,
  ProductsResponse,
  RuntimeImageConfigResponse,
  SaveGeneratedContentResponse,
  TaskHistoryResponse,
  TaskStatusResponse,
  VideoGenerationResult,
  VideoGenerationTask,
} from "./types"

const HISTORY_REFRESH_MS = 5000
const POLL_INTERVAL_MS = 2000
const ELAPSED_TIME_INTERVAL_MS = 1000
const PROGRESS_SIMULATION_INTERVAL_MS = 400
const ENV_OSS_DOMAIN = process.env.NEXT_PUBLIC_ALIYUN_OSS_CUSTOM_DOMAIN ?? ""

function isAbsoluteUrl(rawUrl: string | undefined): boolean {
  return Boolean(rawUrl && /^https?:\/\//i.test(rawUrl))
}

function buildImageUrl(
  rawUrl: string | undefined,
  ossCustomDomain?: string | null
): string | null {
  if (!rawUrl) {
    return null
  }

  if (isAbsoluteUrl(rawUrl)) {
    return rawUrl
  }

  if (ossCustomDomain) {
    return `https://${ossCustomDomain}/${rawUrl.replace(/^\/+/, "")}`
  }

  return null
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

function parseVideoResult(
  result: VideoGenerationTask["result"]
): VideoGenerationResult | null {
  if (!result) {
    return null
  }

  if (typeof result === "string") {
    try {
      return JSON.parse(result) as VideoGenerationResult
    } catch {
      return null
    }
  }

  return result
}

function getPreferredVideoUrl(task: VideoGenerationTask | undefined): string | null {
  const result = parseVideoResult(task?.result)

  return result?.oss_url ?? result?.video_url ?? null
}

function getRawVideoUrl(task: VideoGenerationTask | undefined): string | null {
  return parseVideoResult(task?.result)?.video_url ?? null
}

function getTaskProductId(task: VideoGenerationTask | undefined): string | null {
  const productId = parseVideoResult(task?.result)?.product_id

  return typeof productId === "string" && productId.trim()
    ? productId.trim()
    : null
}

export default function VideoGenerator() {
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  )
  const [videoDescription, setVideoDescription] = useState("")
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
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(
    null
  )
  const [history, setHistory] = useState<VideoGenerationTask[]>([])
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(
    null
  )
  const [activeVideoTaskId, setActiveVideoTaskId] = useState<string | null>(null)
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null)

  const pollingRef = useRef<number | null>(null)
  const progressTimerRef = useRef<number | null>(null)
  const historyTimerRef = useRef<number | null>(null)
  const elapsedTimerRef = useRef<number | null>(null)
  const isFetchingHistoryRef = useRef(false)
  const isPollingTaskRef = useRef(false)

  const productMap = useMemo(() => {
    const map = new Map<string, Product>()

    for (const product of products) {
      map.set(product.product_id, product)
    }

    return map
  }, [products])

  const selectedProduct = useMemo(
    () => (selectedProductId ? productMap.get(selectedProductId) ?? null : null),
    [productMap, selectedProductId]
  )

  const resolvedOssCustomDomain = useMemo(() => {
    return runtimeOssDomain || ENV_OSS_DOMAIN || null
  }, [runtimeOssDomain])

  const selectedProductImageUrl = useMemo(
    () => buildImageUrl(selectedProduct?.main_image, resolvedOssCustomDomain),
    [resolvedOssCustomDomain, selectedProduct]
  )

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
      const response = await fetch("/api/tasks/video", { signal })
      const payload = await readJson<TaskHistoryResponse>(
        response,
        "获取视频生成历史失败"
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
            setProgress(100)
            setStatusText("生成完成")
            setGeneratedVideoUrl(getPreferredVideoUrl(currentTask))
            setActiveVideoTaskId(currentTask.id)
            setGenerationStartedAt(null)
            stopGeneration()
            setTaskId(null)
            void fetchHistory()
            toast.success("短视频生成成功")
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

          setStatusText("AI 正在生成视频...")
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
    [clearPolling, fetchHistory, stopGeneration]
  )

  const handleCategoryChange = useCallback((category: string): void => {
    startTransition(() => {
      setSelectedCategory(category)
      setSelectedProductId(null)
      setProducts([])
      setGeneratedVideoUrl(null)
      setTaskId(null)
      setActiveVideoTaskId(null)
    })
  }, [])

  const handleProductChange = useCallback((productId: string | null): void => {
    startTransition(() => {
      setSelectedProductId(productId)
      setGeneratedVideoUrl(null)
      setTaskId(null)
      setActiveVideoTaskId(null)
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
    setGeneratedVideoUrl(null)
    setActiveVideoTaskId(null)
    setGenerationStartedAt(Date.now())

    try {
      const response = await fetch("/api/generate_video", {
        body: JSON.stringify({
          image_url: selectedProductImageUrl,
          product_id: selectedProductId,
          text_description: videoDescription.trim(),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const payload = await readJson<GenerateVideoResponse>(
        response,
        "提交生成任务失败"
      )

      if (payload.status !== "success" || !payload.task_id) {
        throw new Error(payload.error ?? payload.message ?? "提交生成任务失败")
      }

      setTaskId(payload.task_id)
      setStatusText("任务已提交，后台生成中...")
      startProgressSimulation()
      pollTaskStatus(payload.task_id)
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
    videoDescription,
  ])

  const handleViewVideo = useCallback((task: VideoGenerationTask): void => {
    const nextVideoUrl = getPreferredVideoUrl(task)

    if (!nextVideoUrl) {
      toast.warning("该任务暂无可播放的视频")
      return
    }

    startTransition(() => {
      setGeneratedVideoUrl(nextVideoUrl)
      setActiveVideoTaskId(task.id)
    })
  }, [])

  const handleDownloadVideo = useCallback((task: VideoGenerationTask): void => {
    const nextVideoUrl = getPreferredVideoUrl(task)

    if (!nextVideoUrl) {
      toast.warning("该任务暂无可下载的视频")
      return
    }

    window.open(nextVideoUrl, "_blank", "noopener,noreferrer")
  }, [])

  const handleSaveVideo = useCallback(
    async (task: VideoGenerationTask): Promise<void> => {
      const rawVideoUrl = getRawVideoUrl(task)
      const productId = getTaskProductId(task)

      if (!rawVideoUrl || !productId) {
        toast.warning("当前任务缺少保存所需的信息")
        return
      }

      setSavingTaskId(task.id)

      try {
        const response = await fetch("/api/save_generated_content", {
          body: JSON.stringify({
            file_url: rawVideoUrl,
            product_id: productId,
            task_id: task.id,
            type: "video",
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        })
        const payload = await readJson<SaveGeneratedContentResponse>(
          response,
          "保存视频到素材库失败"
        )

        if (payload.status !== "success") {
          throw new Error(payload.error ?? "保存视频到素材库失败")
        }

        if (activeVideoTaskId === task.id && payload.oss_url) {
          setGeneratedVideoUrl(payload.oss_url)
        }

        toast.success("视频已保存到素材库")
        void fetchHistory()
      } catch (error) {
        toast.danger(getErrorMessage(error, "保存视频到素材库失败"))
      } finally {
        setSavingTaskId(null)
      }
    },
    [activeVideoTaskId, fetchHistory]
  )

  const generatorState = useMemo(() => {
    if (isGenerating || taskId) {
      return "generating" as const
    }

    if (generatedVideoUrl) {
      return "completed" as const
    }

    return "empty" as const
  }, [generatedVideoUrl, isGenerating, taskId])

  const hasProgressPanel = isGenerating || progress > 0

  return (
    <>
      <Toast.Provider placement="bottom end" />
      <Card className="w-full rounded-2xl border-0 bg-[#EFEFEF] shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:bg-slate-900/85 dark:shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
        <Card.Header className="border-b border-gray-200 px-6 py-2.5 dark:border-slate-700">
          <div>
            <Card.Title className="text-lg font-semibold text-gray-800 dark:text-slate-100">
              短视频智造
            </Card.Title>
            <Card.Description className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              AI 驱动的商品短视频生成工具
            </Card.Description>
          </div>
        </Card.Header>

        <Card.Content className="space-y-5 px-6 pb-6 pt-1.5">
          <div className="w-full">
            <VideoGenerationArea
              className="min-h-[520px]"
              elapsedTime={elapsedTime}
              progress={progress}
              state={generatorState}
              statusText={statusText}
              videoUrl={generatedVideoUrl}
            />
          </div>

          <div className="space-y-6">
            <Card className="rounded-xl border-0 bg-[#F8F8F8] shadow-none dark:bg-slate-900/90 dark:ring-1 dark:ring-white/10">
              <Card.Header className="border-b border-gray-200 px-5 py-4 dark:border-slate-700">
                <Card.Title className="text-base font-semibold text-gray-800 dark:text-slate-100">
                  视频生成设置与描述
                </Card.Title>
              </Card.Header>

              <Card.Content className="space-y-4 p-5">
                <div className="grid gap-6 xl:grid-cols-[6fr_4fr]">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      描述文本
                    </Label>
                    <TextArea
                      className="h-[200px] min-h-[200px] w-full resize-none rounded-xl border-0 bg-white px-4 py-3 text-sm text-gray-700 shadow-[inset_2px_2px_5px_rgba(203,213,225,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.9)] outline-none transition-shadow duration-200 focus:ring-2 focus:ring-[#91C1FA]/20 dark:bg-slate-800/90 dark:text-slate-200 dark:shadow-[inset_2px_2px_8px_rgba(0,0,0,0.35)]"
                      disabled={isGenerating}
                      placeholder="请输入视频描述内容，例如：镜头围绕商品缓慢推进，突出包装、质地和使用场景。"
                      rows={8}
                      value={videoDescription}
                      onChange={(event) => setVideoDescription(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      商品主图预览
                    </Label>
                    <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-4 shadow-[inset_2px_2px_5px_rgba(203,213,225,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.9)] dark:border-slate-600 dark:bg-slate-800/80 dark:shadow-[inset_2px_2px_8px_rgba(0,0,0,0.35)]">
                      {selectedProductImageUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt={selectedProduct?.name ?? "商品主图"}
                            className="max-h-48 max-w-full rounded-lg object-contain"
                            src={selectedProductImageUrl}
                          />
                        </>
                      ) : (
                        <p className="text-center text-sm text-gray-400 dark:text-slate-500">
                          {previewDescription ?? "选择具体商品后，这里会显示主图预览。"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[3fr_3fr_4fr]">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      商品分类
                    </Label>
                    <Select
                      className="w-full"
                      isDisabled={isGenerating || isLoadingCategories}
                      placeholder={isLoadingCategories ? "加载中..." : "选择分类"}
                      selectedKey={selectedCategory || null}
                      onSelectionChange={(key) =>
                        handleCategoryChange(key ? key.toString() : "")
                      }
                    >
                      <Select.Trigger className="h-11 w-full rounded-lg border-0 bg-[#F1F5F9] shadow-[inset_2px_2px_5px_rgba(203,213,225,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.9)] dark:bg-slate-800 dark:shadow-none">
                        <FolderTree className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                        <Select.Value />
                        {isLoadingCategories ? (
                          <Spinner color="accent" size="sm" />
                        ) : (
                          <Select.Indicator />
                        )}
                      </Select.Trigger>
                      <Select.Popover className="rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <ListBox className="max-h-60 overflow-auto py-1">
                          {categories.map((category) => (
                            <ListBox.Item
                              className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-[#91C1FA]/10 hover:text-[#91C1FA] dark:text-slate-200 dark:hover:bg-sky-950/50"
                              id={category}
                              key={category}
                              textValue={category}
                            >
                              {category}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      商品选择
                    </Label>
                    <Select
                      className="w-full"
                      isDisabled={
                        !selectedCategory || isGenerating || isLoadingProducts
                      }
                      placeholder={
                        isLoadingProducts
                          ? "加载中..."
                          : selectedCategory
                            ? "选择商品"
                            : "请先选择分类"
                      }
                      selectedKey={selectedProductId || null}
                      onSelectionChange={(key) => {
                        const value = key ? key.toString() : null
                        handleProductChange(value)
                      }}
                    >
                      <Select.Trigger className="h-11 w-full rounded-lg border-0 bg-[#F1F5F9] shadow-[inset_2px_2px_5px_rgba(203,213,225,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.9)] dark:bg-slate-800 dark:shadow-none">
                        <Package2 className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                        <Select.Value />
                        {isLoadingProducts ? (
                          <Spinner color="accent" size="sm" />
                        ) : (
                          <Select.Indicator />
                        )}
                      </Select.Trigger>
                      <Select.Popover className="rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                        <ListBox className="max-h-60 overflow-auto py-1">
                          {products.map((product) => (
                            <ListBox.Item
                              className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-[#91C1FA]/10 hover:text-[#91C1FA] dark:text-slate-200 dark:hover:bg-sky-950/50"
                              id={product.product_id}
                              key={product.product_id}
                              textValue={product.name}
                            >
                              {product.name}
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      className="h-11 w-full rounded-xl bg-[#91C1FA] font-medium text-white hover:bg-[#7AB8FA]"
                      isDisabled={!canGenerate || isGenerating}
                      isPending={isGenerating}
                      onPress={handleGenerate}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {!isGenerating ? <Sparkles className="h-4 w-4" /> : null}
                        {isGenerating ? "生成中..." : "生成视频"}
                      </span>
                    </Button>
                  </div>
                </div>

                {generateDisabledReason ? (
                  <p className="rounded-xl bg-white px-4 py-3 text-sm text-gray-500 shadow-sm dark:bg-slate-800/80 dark:text-slate-400">
                    {isLoadingRuntimeConfig
                      ? "正在准备图片配置，稍后即可发起生成。"
                      : generateDisabledReason}
                  </p>
                ) : null}
              </Card.Content>
            </Card>

            {hasProgressPanel ? (
              <GenerationProgress
                ariaLabel="视频生成进度"
                elapsedTime={elapsedTime}
                progress={progress}
                statusText={statusText}
                title="生成进度"
              />
            ) : null}
          </div>

          <VideoGenerationHistory
            savingTaskId={savingTaskId}
            tasks={history}
            onDownload={handleDownloadVideo}
            onSave={handleSaveVideo}
            onView={handleViewVideo}
          />
        </Card.Content>
      </Card>
    </>
  )
}
