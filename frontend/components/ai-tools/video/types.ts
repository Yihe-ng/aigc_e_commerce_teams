'use client'

import type {
  CategoriesResponse,
  Product,
  ProductsResponse,
  TaskStatus,
} from '@/lib/types/ai-tools'

export type { CategoriesResponse, Product, ProductsResponse, TaskStatus }

export interface VideoGenerationResult {
  video_url?: string
  cover_url?: string
  points_cost?: number
  log?: string[]
}

export interface VideoGenerationTask {
  id: string
  type: 'video_generation' | 'video'
  status: TaskStatus
  result?: VideoGenerationResult | string | null
  error?: string | null
  created_at: string
  updated_at?: string
}

export interface GenerateVideoResponse {
  status: string
  task_id?: string
  message?: string
  error?: string
}

export interface TaskStatusResponse {
  status: string
  task?: VideoGenerationTask
  error?: string
}

export interface TaskHistoryResponse {
  status: string
  tasks: VideoGenerationTask[]
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
