/**
 * @fileoverview AI 工具公共类型
 * @description 供图片与视频生成工具共享的数据结构定义。
 */

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Product {
  product_id: string
  name: string
  main_image?: string
  category?: string
}

export interface GenerationTask {
  id: string
  type: string
  status: TaskStatus
  result?: unknown
  error?: string | null
  created_at: string
  updated_at?: string
}

export interface CategoriesResponse {
  status?: string
  code?: number
  data?: string[]
  error?: string
  message?: string
}

export interface ProductsResponse {
  status: string
  data?: Product[]
  error?: string
  message?: string
}
