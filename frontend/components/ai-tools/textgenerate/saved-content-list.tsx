"use client"

import { useEffect, useState } from "react"
import { Button, Card, Chip } from "@heroui/react"
import { Copy, FileText, Trash2 } from "lucide-react"

interface SavedContent {
  id: string
  product_name: string
  content: string
  tags: string[]
  created_at: string
}

interface SavedContentListProps {
  onSelect?: (content: SavedContent) => void
}

export function SavedContentList({ onSelect }: SavedContentListProps) {
  const [savedContents, setSavedContents] = useState<SavedContent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSavedContents = async () => {
      try {
        const response = await fetch("/api/saved-marketing-contents")
        if (response.ok) {
          const data = await response.json()
          setSavedContents(data.contents || [])
        }
      } catch (error) {
        console.error("Failed to fetch saved marketing contents:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSavedContents()
  }, [])

  const handleSelect = (content: SavedContent) => {
    onSelect?.(content)
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/saved-marketing-contents/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSavedContents((prev) => prev.filter((item) => item.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete marketing content:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  if (savedContents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 text-center">暂时还没有已保存的营销文案</p>
        <p className="text-gray-400 text-sm text-center mt-2">
          当商品保存了最佳营销文案后，会自动出现在这里
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        已保存的营销文案
      </h3>

      {savedContents.map((item) => (
        <div
          key={item.id}
          onClick={() => handleSelect(item)}
          className="cursor-pointer"
        >
          <Card className="bg-gray-50 border border-gray-100 rounded-2xl hover:border-gray-200 transition-colors">
            <Card.Content className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {item.product_name}
                  </h4>
                  <span className="text-xs text-gray-400">{item.created_at}</span>
                </div>
              </div>

              <p className="text-gray-800 text-sm leading-relaxed line-clamp-3 mb-3">
                {item.content}
              </p>

              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.map((tag) => (
                    <Chip
                      key={tag}
                      size="sm"
                      className="bg-blue-50 text-blue-600 text-xs"
                    >
                      #{tag}
                    </Chip>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end">
                <div className="flex gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => handleCopy(item.content)}
                    className="text-gray-400 hover:text-blue-500"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => handleDelete(item.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      ))}
    </div>
  )
}
