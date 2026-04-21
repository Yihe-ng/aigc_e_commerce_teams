"use client"

import { useEffect, useState, useCallback, useRef } from "react"

interface UseDataFetchOptions<T> {
  initialData?: T
  cacheTime?: number
  enabled?: boolean
}

interface UseDataFetchReturn<T> {
  data: T | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

type DataFetcher<T> = (signal: AbortSignal) => Promise<T>

interface CacheEntry<T> {
  data: T
  timestamp: number
  lastAccessed: number
}

// LRU 缓存实现
class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>
  private maxSize: number

  constructor(maxSize: number = 50) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: string): CacheEntry<T> | undefined {
    const entry = this.cache.get(key)
    if (entry) {
      // 更新最后访问时间
      entry.lastAccessed = Date.now()
      // 移动到 Map 末尾（最近使用）
      this.cache.delete(key)
      this.cache.set(key, entry)
    }
    return entry
  }

  set(key: string, value: CacheEntry<T>): void {
    // 如果 key 已存在，先删除旧值
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // 如果超过最大限制，删除最久未使用的（Map 的第一个元素）
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, value)
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }

  // 清理过期的缓存条目
  cleanup(maxAge: number): number {
    const now = Date.now()
    let cleaned = 0
    const entries = Array.from(this.cache.entries())
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key)
        cleaned++
      }
    }
    return cleaned
  }
}

// 缓存管理器类，封装定时器管理
class CacheManager<T> {
  private cache: LRUCache<T>
  private cleanupTimer: NodeJS.Timeout | null = null
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 分钟

  constructor(maxSize: number = 50) {
    this.cache = new LRUCache<T>(maxSize)
  }

  get(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key)
  }

  set(key: string, value: CacheEntry<T>): void {
    this.cache.set(key, value)
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  get size(): number {
    return this.cache.size
  }

  // 启动清理定时器
  startCleanup(): void {
    if (this.cleanupTimer) return
    this.cleanupTimer = setInterval(() => {
      const cleaned = this.cache.cleanup(this.CLEANUP_INTERVAL)
      if (cleaned > 0 && process.env.NODE_ENV === "development") {
        console.log(`[useDataFetch] Cleaned up ${cleaned} expired cache entries`)
      }
    }, this.CLEANUP_INTERVAL)
  }

  // 停止清理定时器
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  // 获取统计信息
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: 50,
    }
  }
}

// 全局缓存管理器实例
const globalCacheManager = new CacheManager<unknown>(50)

// 启动清理定时器（仅在浏览器环境）
if (typeof window !== "undefined") {
  globalCacheManager.startCleanup()
}

export function useDataFetch<T>(
  key: string,
  fetcher: DataFetcher<T>,
  options: UseDataFetchOptions<T> = {}
): UseDataFetchReturn<T> {
  const { initialData, cacheTime = 60000, enabled = true } = options
  const [data, setData] = useState<T | undefined>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    // 检查缓存
    const cached = globalCacheManager.get(key)
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setError(null)
      setData(cached.data as T)
      return
    }

    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetcher(controller.signal)
      if (controller.signal.aborted || abortControllerRef.current !== controller) {
        return
      }
      setData(result)
      globalCacheManager.set(key, {
        data: result,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
      })
    } catch (err) {
      if (controller.signal.aborted || abortControllerRef.current !== controller) {
        return
      }
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err)
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false)
      }
    }
  }, [key, fetcher, cacheTime])

  useEffect(() => {
    if (enabled) {
      fetchData()
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [enabled, fetchData])

  return { data, isLoading, error, refetch: fetchData }
}

// 清除特定缓存
export function clearCache(key: string): boolean {
  return globalCacheManager.delete(key)
}

// 清除所有缓存
export function clearAllCache(): void {
  globalCacheManager.clear()
}

// 停止缓存清理（用于应用卸载时）
export function stopCacheCleanup(): void {
  globalCacheManager.stopCleanup()
}

// 获取缓存统计信息（用于调试）
export function getCacheStats(): { size: number; maxSize: number } {
  return globalCacheManager.getStats()
}
