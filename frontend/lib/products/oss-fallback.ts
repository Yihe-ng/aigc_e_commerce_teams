import { fetchProductLibrary } from "@/lib/oss/api"
import type { Product } from "@/lib/types/product"

interface RawProductItem extends Partial<Product> {
  id?: string | number
  product_id?: string
  name?: string
  category?: string
  main_image?: string
  [key: string]: unknown
}

export interface OssFallbackProduct {
  product_id: string
  name: string
  category?: string
  main_image?: string
  [key: string]: unknown
}

function normalizeProduct(item: RawProductItem): OssFallbackProduct | null {
  const productId = String(item.product_id ?? item.id ?? "").trim()
  const name = String(item.name ?? "").trim()

  if (!productId || !name) {
    return null
  }

  return {
    ...item,
    product_id: productId,
    name,
    category: typeof item.category === "string" ? item.category : "",
    main_image: typeof item.main_image === "string" ? item.main_image : "",
  }
}

async function fetchLibraryProducts(signal?: AbortSignal): Promise<OssFallbackProduct[]> {
  const payload = (await fetchProductLibrary(signal)) as RawProductItem[]

  return payload
    .map(normalizeProduct)
    .filter((item): item is OssFallbackProduct => Boolean(item))
}

export async function fetchFallbackCategories(signal?: AbortSignal): Promise<string[]> {
  const products = await fetchLibraryProducts(signal)
  return Array.from(
    new Set(
      products
        .map((product) => product.category?.trim())
        .filter((category): category is string => Boolean(category))
    )
  )
}

export async function fetchFallbackProductsByCategory(
  category: string,
  signal?: AbortSignal
): Promise<OssFallbackProduct[]> {
  const products = await fetchLibraryProducts(signal)
  return products.filter((product) => product.category === category)
}
