"use client"

import { useState, useCallback } from "react"
import { Button } from "@heroui/react"
import { ChevronLeft, ChevronRight, X, ImagePlus } from "lucide-react"

interface CarouselImage {
  url: string
  isPreview?: boolean
}

interface ImageCarouselProps {
  images: CarouselImage[]
  maxCount?: number
  onRemove?: (url: string) => void
  getImageUrl?: (url?: string) => string
}

export function ImageCarousel({ 
  images, 
  onRemove,
  getImageUrl 
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const totalImages = images.length
  const currentImage = images[currentIndex]
  
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1))
  }, [totalImages])
  
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1))
  }, [totalImages])

  const handleRemove = useCallback(() => {
    if (onRemove && currentImage) {
      onRemove(currentImage.url)
      // 删除后调整索引
      if (currentIndex >= totalImages - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
      }
    }
  }, [onRemove, currentImage, currentIndex, totalImages])

  const getImageSrc = (url: string, isPreview?: boolean) => {
    // 预览图片（blob URL）直接使用，不需要处理
    if (isPreview || url.startsWith('blob:')) {
      return url
    }
    // 已上传图片使用 getImageUrl 处理
    return getImageUrl ? getImageUrl(url) : url
  }

  // 空状态
  if (totalImages === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-[24px] border border-slate-100 bg-slate-50">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
          <ImagePlus className="h-5 w-5 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-500">等待上传商品图片</p>
        <p className="mt-1 text-xs text-slate-400">上传后将在此处预览</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* 主图区域 */}
      <div className="group relative flex-1 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <img
          src={getImageSrc(currentImage.url, currentImage.isPreview)}
          alt={`商品图片 ${currentIndex + 1}`}
          className="h-full w-full object-contain"
        />
        
        {/* 左右切换按钮 */}
        {totalImages > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onPress={handlePrev}
              className="absolute left-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full bg-white/80 p-0 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4 text-slate-700" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleNext}
              className="absolute right-2 top-1/2 z-10 h-8 w-8 -translate-y-1/2 rounded-full bg-white/80 p-0 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4 text-slate-700" />
            </Button>
          </>
        )}
        
        {/* 删除按钮 */}
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onPress={handleRemove}
            className="absolute right-2 top-2 z-10 h-7 w-7 rounded-full bg-red-500 p-0 opacity-0 shadow-sm transition-opacity hover:bg-red-600 group-hover:opacity-100"
          >
            <X className="h-3.5 w-3.5 text-white" />
          </Button>
        )}
        
        {/* 图片标签（已上传/待上传） */}
        {currentImage.isPreview && (
          <span className="absolute bottom-2 left-2 rounded-md bg-blue-500 px-2 py-0.5 text-[10px] font-medium text-white">
            待上传
          </span>
        )}
        
        {/* 图片计数 */}
        <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
          {currentIndex + 1} / {totalImages}
        </span>
      </div>
      
      {/* 指示器 */}
      {totalImages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex 
                  ? "w-4 bg-blue-500" 
                  : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
