"use client"

interface PerformanceMetrics {
  route: string
  loadTime: number
  renderTime: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private maxMetrics = 100

  recordRouteChange(route: string, startTime: number) {
    const endTime = performance.now()
    const loadTime = endTime - startTime

    // 使用 Performance API 获取更详细的渲染时间
    let renderTime = 0
    try {
      const navigationEntries = performance.getEntriesByType("navigation")
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming
        if (navEntry && typeof navEntry.domContentLoadedEventEnd === 'number') {
          renderTime = navEntry.domContentLoadedEventEnd - navEntry.startTime
        }
      }
    } catch {
      // 如果 Performance API 不可用，使用 loadTime 作为备选
      renderTime = loadTime
    }

    const metric: PerformanceMetrics = {
      route,
      loadTime,
      renderTime,
      timestamp: Date.now()
    }

    this.metrics.push(metric)
    
    // 限制存储数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // 开发环境下打印日志
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] Route: ${route}, Load: ${loadTime.toFixed(2)}ms, Render: ${renderTime.toFixed(2)}ms`)
    }

    return metric
  }

  getMetrics() {
    return [...this.metrics]
  }

  getAverageLoadTime(route?: string) {
    const relevant = route 
      ? this.metrics.filter(m => m.route === route)
      : this.metrics
    
    if (relevant.length === 0) return 0
    return relevant.reduce((sum, m) => sum + m.loadTime, 0) / relevant.length
  }

  clear() {
    this.metrics = []
  }
}

export const performanceMonitor = new PerformanceMonitor()
