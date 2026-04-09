"use client"

import { Card, Spinner } from "@heroui/react"
import { Edit, Film, ImageIcon, List, SearchX, Trash2, Wand2 } from "lucide-react"

import type { MarketingProduct } from "@/lib/types/marketing"

interface MarketingTableProps {
  products: MarketingProduct[]
  isLoading: boolean
  errorMsg: string | null
  deletingItems: string[]
  onGenerate: (name: string) => void
  onEdit: (name: string) => void
  onDelete: (name: string) => void
  onRefresh: () => void
  getMediaUrl: (url?: string) => string
}

export default function MarketingTable(props: MarketingTableProps) {
  const {
    products,
    isLoading,
    errorMsg,
    deletingItems,
    onGenerate,
    onEdit,
    onDelete,
    onRefresh,
    getMediaUrl,
  } = props

  return (
    <Card className="mt-6 overflow-hidden rounded-3xl border-none bg-[#F8F8F8] shadow-xl dark:bg-slate-900/90 dark:shadow-black/30 dark:ring-1 dark:ring-white/10">
      <Card.Header className="flex items-center justify-between border-b border-slate-100 px-8 pb-4 pt-8 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#91C1FA]/10 text-[#91C1FA]">
            <List className="h-5 w-5" />
          </div>
          <Card.Title className="text-xl font-bold text-slate-800 dark:text-slate-100">已生成素材列表</Card.Title>
        </div>
        {!isLoading ? (
          <span className="text-sm font-medium text-slate-400 dark:text-slate-500">共 {products.length} 个商品素材</span>
        ) : null}
      </Card.Header>

      <Card.Content className="p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-24">
            <Spinner size="lg" color="current" />
            <p className="font-medium text-slate-500 dark:text-slate-400">正在加载营销数据，请稍候...</p>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center space-y-4 bg-red-50/30 py-24">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <span className="text-3xl font-bold text-red-500">!</span>
            </div>
            <p className="text-center text-lg font-medium text-red-500">{errorMsg}</p>
            <button
              onClick={onRefresh}
              className="mt-4 rounded-lg bg-orange-100 px-8 py-2 font-bold text-orange-700 transition-colors hover:bg-orange-200"
            >
              刷新页面重试
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-slate-400 dark:text-slate-500">
            <SearchX className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">暂无营销素材</p>
            <p className="mt-1 text-sm dark:text-slate-500">请先前往文案智造器或营销图创作生成内容。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 bg-[#EFEFEF] text-xs uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-400">
                <tr>
                  <th style={{ width: "12%" }} className="px-6 py-4 font-semibold tracking-wider">商品名称</th>
                  <th style={{ width: "28%" }} className="px-6 py-4 font-semibold tracking-wider">营销文案</th>
                  <th style={{ width: "25%" }} className="px-6 py-4 text-center font-semibold tracking-wider">商品海报</th>
                  <th style={{ width: "25%" }} className="px-6 py-4 text-center font-semibold tracking-wider">营销视频</th>
                  <th style={{ width: "10%" }} className="px-6 py-4 text-center font-semibold tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((product) => {
                  const posterUrl = getMediaUrl(product.posters?.[0]?.url)
                  const videoUrl = getMediaUrl(product.videos?.[0]?.url)

                  return (
                    <tr
                      key={product.product_name}
                      className={`group transition-all duration-300 ${
                        deletingItems.includes(product.product_name)
                          ? "scale-95 bg-red-50 opacity-0"
                          : "opacity-100 hover:bg-gray-100 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <td className="truncate px-6 py-6 text-base font-bold text-slate-800 dark:text-slate-100" title={product.product_name}>
                        {product.product_name || "未命名商品"}
                      </td>
                      <td className="px-6 py-6">
                        {product.marketing_text ? (
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                            {product.marketing_text}
                          </div>
                        ) : (
                          <span className="italic text-slate-400">暂无文案</span>
                        )}
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex justify-center">
                          {posterUrl ? (
                            <div className="relative h-48 w-48 overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-shadow group-hover:shadow-md">
                              <img
                                src={posterUrl}
                                alt="商品海报"
                                className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                              />
                            </div>
                          ) : (
                            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-100 text-slate-400">
                              <ImageIcon className="mb-1 h-5 w-5 opacity-50" />
                              <span className="text-[10px]">无海报</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex justify-center">
                          {videoUrl ? (
                            <div className="relative h-40 w-48 overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm">
                              <video controls className="h-full w-full object-cover" preload="metadata">
                                <source src={videoUrl} type="video/mp4" />
                              </video>
                            </div>
                          ) : (
                            <div className="flex h-24 w-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-100 text-slate-400">
                              <Film className="mb-1 h-5 w-5 opacity-50" />
                              <span className="text-[10px]">无视频</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => onGenerate(product.product_name)}
                            className="rounded-lg bg-purple-50 p-2 text-purple-600 shadow-sm transition-colors hover:bg-purple-100 hover:text-purple-700"
                            title="前往文案智造器"
                          >
                            <Wand2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onEdit(product.product_name)}
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 shadow-sm transition-colors hover:bg-blue-100 hover:text-blue-700"
                            title="编辑基础信息"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDelete(product.product_name)}
                            className="rounded-lg bg-red-50 p-2 text-red-500 shadow-sm transition-colors hover:bg-red-100 hover:text-red-600"
                            title="删除素材"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card.Content>
    </Card>
  )
}
