import type { MarketingProduct } from "@/lib/types/marketing"
import type {
  CategoriesResponse,
  Product as AiToolProduct,
  ProductsResponse,
} from "@/lib/types/ai-tools"
import type { Product } from "@/lib/types/product"

interface ApiPayload {
  status?: string
  code?: number
  error?: string
  msg?: string
  message?: string
}

interface ProductDetailPayload extends ApiPayload {
  product?: Product
}

interface MarketingProductsPayload extends ApiPayload {
  data?: MarketingProduct[]
}

interface UploadImagePayload extends ApiPayload {
  image_url?: string
  temp_path?: string
  filename?: string
}

interface SaveProductPayload extends ApiPayload {
  product_id?: string
  product?: Product
}

interface DeleteMarketingPayload extends ApiPayload {
  deleted_count?: number
}

interface SaveGeneratedContentPayload extends ApiPayload {
  oss_url?: string
  save_path?: string
}

function buildNoCacheUrl(path: string): string {
  // 使用相对路径构建URL，避免硬编码base URL导致的生产环境问题
  const url = new URL(path, "http://placeholder")
  url.searchParams.set("t", Date.now().toString())
  return `${url.pathname}${url.search}`
}

async function readJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  const rawBody = await response.text()
  const contentType = response.headers.get("content-type") ?? ""
  const looksLikeHtml = /^\s*</.test(rawBody)
  let payload: (T & ApiPayload) | null = null

  try {
    payload = JSON.parse(rawBody) as T & ApiPayload
  } catch {
    if (looksLikeHtml || !contentType.includes("application/json")) {
      throw new Error(`${fallbackMessage}：接口返回了 HTML 页面，请检查 Next rewrite 或后端路由。`)
    }

    throw new Error(fallbackMessage)
  }

  if (!response.ok) {
    throw new Error(payload.error ?? payload.msg ?? payload.message ?? fallbackMessage)
  }

  return payload
}

export async function fetchProductLibrary(signal?: AbortSignal): Promise<Product[]> {
  const response = await fetch(buildNoCacheUrl("/api/products/library"), { signal })
  return readJson<Product[]>(response, "加载商品列表失败，请稍后重试。")
}

export async function fetchProductDetail(
  id: string | number,
  signal?: AbortSignal
): Promise<Product> {
  const response = await fetch(`/api/products/library/${id}`, { signal })
  const payload = await readJson<ProductDetailPayload>(response, "加载商品详情失败，请重试。")

  if (!payload.product) {
    throw new Error(payload.error ?? payload.message ?? "商品详情数据缺失")
  }

  return payload.product
}

export async function uploadProductImage(file: File): Promise<UploadImagePayload> {
  const body = new FormData()
  body.append("file", file)

  const response = await fetch("/api/products/upload-image", {
    method: "POST",
    body,
  })

  return readJson<UploadImagePayload>(response, "图片上传失败，请检查后端服务。")
}

export async function saveLibraryProduct(
  payload: Record<string, unknown>,
  id?: string | number | null
): Promise<SaveProductPayload> {
  const response = await fetch(id ? `/api/products/save/${id}` : "/api/products/save", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  return readJson<SaveProductPayload>(response, "保存商品信息失败，请稍后重试。")
}

export async function deleteLibraryProduct(id: string | number): Promise<void> {
  const response = await fetch(`/api/products/delete/${id}`, {
    method: "DELETE",
  })

  await readJson<ApiPayload>(response, "删除商品失败，请稍后重试。")
}

export async function fetchMarketingProducts(signal?: AbortSignal): Promise<MarketingProduct[]> {
  const response = await fetch(buildNoCacheUrl("/api/products/marketing-materials"), {
    signal,
  })
  const payload = await readJson<MarketingProductsPayload>(
    response,
    "加载营销素材失败，请刷新重试。"
  )

  if (payload.status !== "success" && payload.code !== 200) {
    throw new Error(payload.message ?? payload.error ?? "后端返回了异常的数据格式。")
  }

  return payload.data ?? []
}

export async function fetchOssCategories(signal?: AbortSignal): Promise<string[]> {
  const response = await fetch("/api/oss/categories", { signal })
  const payload = await readJson<CategoriesResponse>(response, "获取分类失败")

  if (payload.status !== "success" && payload.code !== 200) {
    throw new Error(payload.error ?? payload.message ?? "获取分类失败")
  }

  return payload.data ?? []
}

export async function fetchOssProductsByCategory(
  category: string,
  signal?: AbortSignal
): Promise<AiToolProduct[]> {
  const params = new URLSearchParams({ category })
  const response = await fetch(`/api/oss/products_by_category?${params.toString()}`, {
    signal,
  })
  const payload = await readJson<ProductsResponse>(response, "获取商品失败")

  if (payload.status !== "success") {
    throw new Error(payload.error ?? payload.message ?? "获取商品失败")
  }

  return payload.data ?? []
}

export async function deleteMarketingMaterials(
  productName: string
): Promise<DeleteMarketingPayload> {
  const response = await fetch("/api/products/marketing-materials/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_name: productName }),
  })

  const payload = await readJson<DeleteMarketingPayload>(
    response,
    "删除营销素材失败，请稍后重试。"
  )

  if (payload.status !== "success" && payload.code !== 200) {
    throw new Error(payload.message ?? payload.error ?? "删除请求被拒绝。")
  }

  return payload
}

export async function saveGeneratedContent(
  payload: Record<string, unknown>,
  signal?: AbortSignal
): Promise<SaveGeneratedContentPayload> {
  const response = await fetch("/api/save_generated_content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  })

  return readJson<SaveGeneratedContentPayload>(response, "保存生成内容失败。")
}
