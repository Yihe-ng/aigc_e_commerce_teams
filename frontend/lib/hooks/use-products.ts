"use client"

import { useDataFetch } from "./use-data-fetch"
import { fetchProductLibrary, fetchProductDetail } from "@/lib/oss/api"
import type { Product } from "@/lib/types/product"

const CACHE_TIME = 5 * 60 * 1000 // 5分钟缓存

export function useProducts(enabled = true) {
  return useDataFetch<Product[]>(
    "products-library",
    (signal) => fetchProductLibrary(signal),
    { cacheTime: CACHE_TIME, enabled }
  )
}

export function useProductDetail(id: string | number | null) {
  return useDataFetch<Product>(
    `product-detail-${id}`,
    (signal) => fetchProductDetail(id!, signal),
    { enabled: !!id, cacheTime: CACHE_TIME }
  )
}
