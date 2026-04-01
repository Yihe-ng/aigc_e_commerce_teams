"use client"

import { Card } from "@heroui/react"
import { Edit, List, Trash2 } from "lucide-react"

import type { Product } from "@/lib/types/product"

interface ProductTableProps {
  products: Product[]
  onEdit: (id: string | number) => void
  onDelete: (id: string | number) => void
  getImageUrl: (url?: string) => string
}

export default function ProductTable({ products, onEdit, onDelete, getImageUrl }: ProductTableProps) {
  return (
    <Card className="mt-8 overflow-hidden rounded-3xl border-none bg-[#F8F8F8] shadow-xl">
      <Card.Header className="flex items-center justify-between border-b border-slate-100 px-8 pb-4 pt-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
            <List className="h-5 w-5" />
          </div>
          <Card.Title className="text-xl font-bold text-slate-800">已入库商品列表</Card.Title>
        </div>
        <span className="text-sm font-medium text-slate-400">共 {products.length} 件商品</span>
      </Card.Header>

      <Card.Content className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-[#EFEFEF] text-xs uppercase text-slate-500">
              <tr>
                <th style={{ width: "12%" }} className="px-8 py-4 font-semibold tracking-wider">主图</th>
                <th style={{ width: "20%" }} className="px-6 py-4 font-semibold tracking-wider">名称</th>
                <th style={{ width: "15%" }} className="px-6 py-4 font-semibold tracking-wider">类别</th>
                <th style={{ width: "10%" }} className="px-6 py-4 font-semibold tracking-wider">价格</th>
                <th style={{ width: "28%" }} className="px-6 py-4 font-semibold tracking-wider">特点</th>
                <th style={{ width: "15%" }} className="px-8 py-4 text-center font-semibold tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => {
                const featureText = Array.isArray(product.features)
                  ? product.features.join(" | ")
                  : product.features
                const previewImage = product.main_image || product.images?.[0]
                const resolvedPreviewImage = getImageUrl(previewImage)

                return (
                  <tr key={product.id} className="group transition-colors hover:bg-gray-100">
                    <td className="px-8 py-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-400 shadow-sm">
                        {resolvedPreviewImage ? (
                          <img src={resolvedPreviewImage} alt="商品主图" className="h-full w-full object-cover" />
                        ) : (
                          <span>暂无</span>
                        )}
                      </div>
                    </td>
                    <td className="truncate px-6 py-4 font-bold text-slate-800" title={product.name}>
                      {product.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-600">
                      ￥{Number.parseFloat(String(product.price || 0)).toFixed(2)}
                    </td>
                    <td className="max-w-[200px] truncate px-6 py-4 text-slate-500" title={featureText}>
                      {featureText}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => onEdit(product.id)}
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 shadow-sm transition-colors hover:bg-blue-100 hover:text-blue-700"
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(product.id)}
                          className="rounded-lg bg-red-50 p-2 text-red-500 shadow-sm transition-colors hover:bg-red-100 hover:text-red-600"
                          title="删除"
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

        {products.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <List className="mb-3 h-12 w-12 text-slate-200" />
            <p>暂无商品数据，请在上方添加</p>
          </div>
        ) : null}
      </Card.Content>
    </Card>
  )
}
