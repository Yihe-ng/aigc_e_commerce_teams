"use client"

import type {
  CategoriesResponse,
  Product,
  ProductsResponse,
  TaskStatus,
} from "@/lib/types/ai-tools"

export type { CategoriesResponse, Product, ProductsResponse, TaskStatus }

export interface GenerationResult {
  image_url: string
  percent?: number
  product_id?: string
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
