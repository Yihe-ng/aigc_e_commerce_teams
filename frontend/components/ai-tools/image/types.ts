"use client"

export type TaskStatus = "pending" | "processing" | "completed" | "failed"

export interface Product {
  product_id: string
  name: string
  main_image?: string
  category?: string
}

export interface GenerationResult {
  image_url: string
  percent?: number
}

export interface GenerationTask {
  id: string
  type: string
  status: TaskStatus
  result?: GenerationResult | string | null
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

export interface GenerateImageResponse {
  code: number
  msg: string
  data: {
    task_id: string
    generateUuid?: string
  } | null
}

export interface TaskStatusResponse {
  status: string
  task?: GenerationTask
  error?: string
}

export interface TaskHistoryResponse {
  status: string
  tasks: GenerationTask[]
}

export interface SaveGeneratedContentResponse {
  status: string
  error?: string
  oss_url?: string
}

export interface RuntimeImageConfig {
  oss_custom_domain?: string
}

export interface RuntimeImageConfigResponse {
  status: string
  data?: RuntimeImageConfig
  error?: string
  message?: string
}
