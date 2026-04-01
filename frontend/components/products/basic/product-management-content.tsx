"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react"
import { useSearchParams } from "next/navigation"

import ProductForm from "@/components/products/product-form"
import ProductHeader from "@/components/products/product-header"
import ProductTable from "@/components/products/product-table"
import { buildOssAssetUrl, fetchRuntimeOssDomain, resolveOssCustomDomain } from "@/lib/oss/shared"
import type { Category, Product, ProductFormValue } from "@/lib/types/product"

const API_BASE = "http://localhost:5000"

const EMPTY_FORM: ProductFormValue = {
  name: "",
  category: "",
  price: "",
  features: "",
  description: "",
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

  useEffect(() => {
    const controller = new AbortController()
    void fetchProducts(controller.signal)

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
      const response = await fetch(`${API_BASE}/get_products?t=${Date.now()}`, { signal })
      if (!response.ok) {
        throw new Error("加载商品列表失败，请稍后重试。")
      }
      const data = (await response.json()) as Product[]
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
      const response = await fetch(`${API_BASE}/get_product_detail/${id}`)
      if (!response.ok) {
        throw new Error("加载商品详情失败，请重试。")
      }

      const data = await response.json()
      const product = data.product as Product

      setFormData({
        name: product.name || "",
        category: product.category || "",
        price: product.price ? String(product.price) : "",
        features: Array.isArray(product.features) ? product.features.join("\n") : product.features || "",
        description: product.description || "",
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
      await fetch(`${API_BASE}/delete_product/${id}`, { method: "DELETE" })
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setNotice(null)

    try {
      setIsUploading(true)
      const newUploadedUrls: string[] = []

      if (previewImages.length > 0) {
        for (const item of previewImages) {
          const uploadData = new FormData()
          uploadData.append("file", item.file)

          const uploadResponse = await fetch(`${API_BASE}/upload_image`, {
            method: "POST",
            body: uploadData,
          })

          if (!uploadResponse.ok) {
            throw new Error("图片上传失败，请检查后端服务。")
          }

          const uploadResult = await uploadResponse.json()
          newUploadedUrls.push(uploadResult.image_url as string)
        }
      }

      const payload = {
        name: formData.name,
        category: formData.category,
        price: Number.parseFloat(formData.price) || 0,
        features: formData.features.split("\n").filter((feature) => feature.trim() !== ""),
        description: formData.description,
        images: [...uploadedUrls, ...newUploadedUrls],
      }

      const url = editingId ? `${API_BASE}/save_product/${editingId}` : `${API_BASE}/save_product`
      const method = editingId ? "PUT" : "POST"

      const saveResponse = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!saveResponse.ok) {
        throw new Error("保存商品信息失败，请稍后重试。")
      }

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
    <div className="flex h-full min-h-0 w-full flex-col gap-6 rounded-2xl border-0 bg-[#EFEFEF] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] md:p-6">
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
      />

      <ProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} getImageUrl={getImageUrl} />
    </div>
  )
}
