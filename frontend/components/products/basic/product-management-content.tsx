"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react"
import { useSearchParams } from "next/navigation"

import ProductForm from "@/components/products/product-form"
import ProductHeader from "@/components/products/product-header"
import ProductTable from "@/components/products/product-table"
import {
  deleteLibraryProduct,
  fetchProductDetail,
  fetchProductLibrary,
  saveLibraryProduct,
  uploadProductImage,
} from "@/lib/oss/api"
import { buildOssAssetUrl, fetchRuntimeOssDomain, resolveOssCustomDomain } from "@/lib/oss/shared"
import type { Category, Product, ProductFormValue, SizeChartRow } from "@/lib/types/product"

const EMPTY_FORM: ProductFormValue = {
  name: "",
  category: "",
  price: "",
  features: "",
  description: "",
  sizes: [],
  size_chart: [],
  colors: [],
  fit: "",
  fabric: "",
  style: "",
  scene: [],
  tags: [],
}

interface NoticeState {
  tone: "success" | "error"
  message: string
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

export default function ProductManagementContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [formData, setFormData] = useState<ProductFormValue>(EMPTY_FORM)
  const [previewImages, setPreviewImages] = useState<{ file: File; url: string }[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoSaveMsg, setAutoSaveMsg] = useState("")
  const [notice, setNotice] = useState<NoticeState | null>(null)
  const [runtimeOssDomain, setRuntimeOssDomain] = useState<string | null>(null)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories: Category[] = useMemo(
    () => [
      { key: "服装", label: "服装" },
      { key: "电子产品", label: "电子产品" },
      { key: "食品", label: "食品" },
      { key: "美妆", label: "美妆" },
      { key: "其他", label: "其他" },
    ],
    [],
  )

  // 商品列表是主流程，OSS 配置失败不应阻塞页面可用性
  useEffect(() => {
    const controller = new AbortController()
    void fetchProducts(controller.signal)

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

  useEffect(() => {
    if (editingId) {
      return
    }

    const draft = window.localStorage.getItem("product_draft")
    if (!draft) {
      return
    }

    try {
      setFormData(JSON.parse(draft) as ProductFormValue)
      setNotice({ tone: "success", message: "已恢复上次编辑的草稿。" })
    } catch {
      window.localStorage.removeItem("product_draft")
    }
  }, [editingId])

  useEffect(() => {
    if (editingId || !formData.name.trim()) {
      return
    }

    const timer = window.setTimeout(() => {
      window.localStorage.setItem("product_draft", JSON.stringify(formData))
      setAutoSaveMsg("已自动保存草稿")
      window.setTimeout(() => setAutoSaveMsg(""), 3000)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [editingId, formData])

  useEffect(() => {
    const editProductName = searchParams?.get("edit_product")
    if (!editProductName || products.length === 0 || editingId) {
      return
    }

    const targetProduct = products.find((product) => product.name === editProductName)
    if (!targetProduct) {
      return
    }

    void handleEdit(targetProduct.id)
    window.history.replaceState({}, document.title, window.location.pathname)
  }, [editingId, products, searchParams])

  async function fetchProducts(signal?: AbortSignal) {
    try {
      const data = await fetchProductLibrary(signal)
      setProducts(data)
    } catch (error) {
      if (isAbortError(error)) {
        return
      }
      console.error(error)
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "加载商品列表失败，请稍后重试。",
      })
    }
  }

  function handleInputChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files) {
      return
    }

    const files = Array.from(event.target.files)
    const nextPreviews = files.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setPreviewImages((current) => [...current, ...nextPreviews])

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files ?? [])
    const nextPreviews = files.map((file) => ({ file, url: URL.createObjectURL(file) }))
    setPreviewImages((current) => [...current, ...nextPreviews])
  }

  function removePreview(url: string) {
    setPreviewImages((current) => {
      const target = current.find((item) => item.url === url)
      if (target) {
        URL.revokeObjectURL(target.url)
      }
      return current.filter((item) => item.url !== url)
    })
  }

  function removeUploaded(url: string) {
    if (!window.confirm("确定要移除这张已上传图片吗？")) {
      return
    }
    setUploadedUrls((current) => current.filter((item) => item !== url))
  }

  async function handleEdit(id: string | number) {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" })
      const product = await fetchProductDetail(id)

      const sizeChartRecord = product.size_chart || {}
      const sizeChartArray: SizeChartRow[] = Object.values(sizeChartRecord)
      const storedSizes = product.sizes || []
      const sizes = storedSizes.length > 0 ? storedSizes : Object.keys(sizeChartRecord)

      setFormData({
        name: product.name || "",
        category: product.category || "",
        price: product.price ? String(product.price) : "",
        features: Array.isArray(product.features) ? product.features.join("\n") : product.features || "",
        description: product.description || "",
        sizes,
        size_chart: sizeChartArray,
        colors: product.colors || [],
        fit: product.fit || "",
        fabric: product.fabric || "",
        style: product.style || "",
        scene: product.scene || [],
        tags: product.tags || [],
      })
      setUploadedUrls(product.images || [])
      setPreviewImages([])
      setEditingId(id)
      setNotice({ tone: "success", message: "商品详情已加载，正在编辑中。" })
    } catch (error) {
      console.error(error)
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "加载商品详情失败，请重试。",
      })
    }
  }

  async function handleDelete(id: string | number) {
    if (!window.confirm("确定要永久删除这个商品吗？该操作不可逆。")) {
      return
    }

    try {
      await deleteLibraryProduct(id)
      await fetchProducts()
      setNotice({ tone: "success", message: "商品删除完成，列表已刷新。" })
    } catch (error) {
      console.error(error)
      await fetchProducts()
      setNotice({ tone: "error", message: "删除请求已发送，但刷新列表时出现异常，请再次确认。" })
    }
  }

  function handleReset() {
    previewImages.forEach((item) => URL.revokeObjectURL(item.url))
    setFormData(EMPTY_FORM)
    setPreviewImages([])
    setUploadedUrls([])
    setEditingId(null)
    setNotice(null)
  }

  function handleSizeToggle(size: string) {
    setFormData((current) => {
      const sizes = current.sizes || []
      const exists = sizes.includes(size)
      const size_chart = current.size_chart || []
      if (exists) {
        return {
          ...current,
          sizes: sizes.filter((s) => s !== size),
          size_chart: size_chart.filter((row) => row.尺码 !== size),
        }
      }
      const newRow: SizeChartRow = {
        尺码: size, 胸围: "", 腰围: "", 臀围: "", 肩宽: "", 袖长: "", 衣长: "", 建议体重: "",
      }
      return {
        ...current,
        sizes: [...sizes, size],
        size_chart: [...size_chart, newRow],
      }
    })
  }

  function handleColorToggle(color: string) {
    setFormData((current) => {
      const colors = current.colors || []
      const exists = colors.includes(color)
      return {
        ...current,
        colors: exists ? colors.filter((c) => c !== color) : [...colors, color],
      }
    })
  }

  function handleFitChange(fit: string) {
    setFormData((current) => ({ ...current, fit }))
  }

  function handleFabricChange(fabric: string) {
    setFormData((current) => ({ ...current, fabric }))
  }

  function handleStyleChange(style: string) {
    setFormData((current) => ({ ...current, style }))
  }

  function handleSceneToggle(scene: string) {
    setFormData((current) => {
      const scenes = current.scene.includes(scene)
        ? current.scene.filter((s) => s !== scene)
        : [...current.scene, scene]
      return { ...current, scene: scenes }
    })
  }

  function handleTagToggle(tag: string) {
    setFormData((current) => {
      const tags = current.tags.includes(tag)
        ? current.tags.filter((t) => t !== tag)
        : [...current.tags, tag]
      return { ...current, tags }
    })
  }

  function handleSizeChartChange(chart: SizeChartRow[]) {
    setFormData((current) => ({ ...current, size_chart: chart }))
  }

  async function handleGenerateDescription() {
    if (!formData.name.trim() || !formData.category || !formData.features.trim()) return

    setIsGeneratingDescription(true)
    try {
      const response = await fetch("/api/products/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          features: formData.features.split("\n").filter((f) => f.trim()),
        }),
      })
      if (!response.ok) throw new Error("生成失败")
      const data = await response.json()
      setFormData((current) => ({
        ...current,
        description: data.description || current.description,
        style: data.style || current.style,
        scene: Array.isArray(data.scene) ? data.scene : current.scene,
        tags: Array.isArray(data.tags) ? data.tags : current.tags,
      }))
    } catch (error) {
      console.error("生成描述失败:", error)
      setNotice({ tone: "error", message: "AI 生成详细描述失败，请稍后重试。" })
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const rowsWithoutUnit = (formData.size_chart || []).filter(
      (row) => row.建议体重 && !/\d\s*(kg|公斤|斤)/i.test(row.建议体重)
    )
    if (rowsWithoutUnit.length > 0) {
      const names = rowsWithoutUnit.map((r) => `“${r.尺码 || "?"}”码`).join("、")
      const ok = window.confirm(
        `${names} 的体重建议未标明单位，将默认按 kg（公斤）处理。\n\n提示：数值后可加 "kg"、"公斤" 或 "斤"。`
      )
      if (!ok) return
    }

    setIsSubmitting(true)
    setNotice(null)

    try {
      setIsUploading(true)
      const newUploadedUrls: string[] = []

      if (previewImages.length > 0) {
        for (const item of previewImages) {
          const uploadResult = await uploadProductImage(item.file)
          if (!uploadResult.image_url) {
            throw new Error("图片上传失败，请检查后端服务。")
          }
          newUploadedUrls.push(uploadResult.image_url)
        }
      }

      const sizeChartRecord: Record<string, SizeChartRow> = {}
      for (const row of formData.size_chart) {
        if (row.尺码) {
          sizeChartRecord[row.尺码] = row
        }
      }

      const finalSizes = formData.sizes.length > 0
        ? formData.sizes
        : formData.size_chart.filter((r) => r.尺码).map((r) => r.尺码)

      const payload = {
        name: formData.name,
        category: formData.category,
        price: Number.parseFloat(formData.price) || 0,
        features: formData.features.split("\n").filter((feature) => feature.trim() !== ""),
        description: formData.description,
        images: [...uploadedUrls, ...newUploadedUrls],
        sizes: finalSizes,
        size_chart: sizeChartRecord,
        colors: formData.colors,
        fit: formData.fit,
        fabric: formData.fabric,
        style: formData.style,
        scene: formData.scene,
        tags: formData.tags,
      }

      await saveLibraryProduct(payload, editingId)

      if (!editingId) {
        window.localStorage.removeItem("product_draft")
      }

      handleReset()
      await fetchProducts()
      setNotice({
        tone: "success",
        message: editingId ? "商品信息已更新。" : "商品信息已保存。",
      })
    } catch (error) {
      console.error(error)
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "商品保存失败，请稍后重试。",
      })
    } finally {
      setIsUploading(false)
      setIsSubmitting(false)
    }
  }

  function getImageUrl(url?: string) {
    return buildOssAssetUrl(url, resolveOssCustomDomain(runtimeOssDomain)) ?? ""
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      {notice ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            notice.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <ProductHeader autoSaveMsg={autoSaveMsg} />

      <ProductForm
        formData={formData}
        categories={categories}
        editingId={editingId}
        previewImages={previewImages}
        uploadedUrls={uploadedUrls}
        isUploading={isUploading}
        isSubmitting={isSubmitting}
        fileInputRef={fileInputRef}
        onChange={handleInputChange}
        onFileSelect={handleFileSelect}
        onDrop={handleDrop}
        onRemovePreview={removePreview}
        onRemoveUploaded={removeUploaded}
        onReset={handleReset}
        onSubmit={handleSubmit}
        getImageUrl={getImageUrl}
        onSizeToggle={handleSizeToggle}
        onColorToggle={handleColorToggle}
        onFitChange={handleFitChange}
        onFabricChange={handleFabricChange}
        onStyleChange={handleStyleChange}
        onSceneToggle={handleSceneToggle}
        onTagToggle={handleTagToggle}
        onSizeChartChange={handleSizeChartChange}
        onGenerateDescription={handleGenerateDescription}
        isGeneratingDescription={isGeneratingDescription}
      />

      <ProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} getImageUrl={getImageUrl} />
    </div>
  )
}
