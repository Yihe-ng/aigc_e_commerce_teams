"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import MarketingHeader from "@/components/products/marketing/marketing-header"
import MarketingTable from "@/components/products/marketing/marketing-table"
import { buildOssAssetUrl, fetchRuntimeOssDomain, resolveOssCustomDomain } from "@/lib/oss/shared"
import type { MarketingProduct } from "@/lib/types/marketing"

const API_BASE = "http://localhost:5000"

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

export default function MarketingAssetsContent() {
  const [products, setProducts] = useState<MarketingProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [deletingItems, setDeletingItems] = useState<string[]>([])
  const [runtimeOssDomain, setRuntimeOssDomain] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()
    void fetchMarketingData(controller.signal)

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    fetchRuntimeOssDomain(controller.signal)
      .then((ossCustomDomain) => {
        setRuntimeOssDomain(ossCustomDomain)
      })
      .catch((error) => {
        if (isAbortError(error)) {
          return
        }
        console.error("加载 OSS 配置失败:", error)
        setRuntimeOssDomain(null)
      })

    return () => controller.abort()
  }, [])

  async function fetchMarketingData(signal?: AbortSignal) {
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const response = await fetch(`${API_BASE}/get_all_marketing_products?t=${Date.now()}`, { signal })
      if (!response.ok) {
        throw new Error("网络请求失败，请刷新重试。")
      }

      const result = await response.json()
      if (result.status === "success" || result.code === 200) {
        setProducts((result.data || []) as MarketingProduct[])
      } else {
        throw new Error(result.message || "后端返回了异常的数据格式。")
      }
    } catch (error) {
      if (isAbortError(error)) {
        return
      }
      console.error("加载营销数据失败:", error)
      setErrorMsg(
        error instanceof Error ? error.message : "加载失败，请检查网络连接或后端服务是否正常运行。",
      )
    } finally {
      setIsLoading(false)
    }
  }

  function handleGenerate(productName: string) {
    if (!productName) {
      return
    }
    router.push(`/ai-tools/textgenerate?product=${encodeURIComponent(productName)}`)
  }

  function handleEdit(productName: string) {
    if (!productName) {
      return
    }
    router.push(`/products/basic?edit_product=${encodeURIComponent(productName)}`)
  }

  async function handleDelete(productName: string) {
    if (!productName) {
      return
    }

    if (!window.confirm(`确定要删除“${productName}”的所有营销素材吗？这不会删除商品基础信息。`)) {
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/delete_marketing_materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_name: productName }),
      })

      const result = await response.json()
      if (result.status === "success" || result.code === 200) {
        setDeletingItems((current) => [...current, productName])
        window.setTimeout(() => {
          setProducts((current) => current.filter((item) => item.product_name !== productName))
          setDeletingItems((current) => current.filter((name) => name !== productName))
        }, 300)
      } else {
        throw new Error(result.message || result.error || "删除请求被拒绝。")
      }
    } catch (error) {
      console.error("删除营销素材失败:", error)
    } finally {
      void fetchMarketingData()
    }
  }

  function getMediaUrl(url?: string) {
    return buildOssAssetUrl(url, resolveOssCustomDomain(runtimeOssDomain)) ?? ""
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6 rounded-2xl border-0 bg-[#EFEFEF] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:bg-slate-900/85 dark:shadow-[0_4px_12px_rgba(0,0,0,0.35)] md:p-6">
      <MarketingHeader />
      <MarketingTable
        products={products}
        isLoading={isLoading}
        errorMsg={errorMsg}
        deletingItems={deletingItems}
        onGenerate={handleGenerate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={() => window.location.reload()}
        getMediaUrl={getMediaUrl}
      />
    </div>
  )
}
