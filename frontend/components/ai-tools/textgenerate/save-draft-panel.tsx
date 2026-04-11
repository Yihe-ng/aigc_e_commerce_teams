"use client"

import {
  Button,
  Card,
  Label,
  ListBox,
  Select,
  Spinner,
  TextArea,
} from "@heroui/react"
import { Package2, Save } from "lucide-react"
import type { Product } from "@/lib/types/product"

export interface SaveDraftValue {
  product_id: string | number | null
  product_name: string
  copy_type: "marketing" | "guide"
  ad_best: string
}

interface SaveDraftPanelProps {
  value: SaveDraftValue
  products: Product[]
  isLoadingProducts?: boolean
  isSaving?: boolean
  onChange: (value: SaveDraftValue) => void
  onSave: () => Promise<void> | void
}

export function SaveDraftPanel({
  value,
  products,
  isLoadingProducts = false,
  isSaving = false,
  onChange,
  onSave,
}: SaveDraftPanelProps) {
  // 使用 product_id 进行匹配，避免同名商品导致的错误匹配
  const hasMatchingProduct = products.some(
    (product) => product.id === value.product_id
  )
  const canSave =
    hasMatchingProduct && value.ad_best.trim().length > 0

  return (
    <Card className="rounded-2xl border border-gray-100 bg-gray-50 dark:border-slate-800 dark:bg-slate-900/90 dark:ring-1 dark:ring-white/10">
      <Card.Content className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">最终方案确认</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            采纳后的文案会自动回填到这里，确认后可保存到商品营销素材库。
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-full">
            <Label className="text-sm font-medium text-gray-700 dark:text-slate-300">商品名称</Label>
            <Select
              className="mt-2 w-full"
              isDisabled={isLoadingProducts || products.length === 0}
              placeholder={
                isLoadingProducts
                  ? "加载商品中..."
                  : products.length > 0
                    ? "请选择已有商品"
                    : "暂无可选商品"
              }
              selectedKey={hasMatchingProduct && value.product_id ? value.product_id.toString() : null}
              onSelectionChange={(key) => {
                const selectedProduct = products.find((p) => p.id.toString() === key)
                onChange({
                  ...value,
                  product_id: selectedProduct?.id ?? null,
                  product_name: selectedProduct?.name ?? "",
                })
              }}
            >
              <Select.Trigger className="h-11 rounded-lg border border-gray-200 bg-white dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100">
                <Package2 className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                <Select.Value />
                {isLoadingProducts ? (
                  <Spinner color="accent" size="sm" />
                ) : (
                  <Select.Indicator />
                )}
              </Select.Trigger>
              <Select.Popover className="rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <ListBox className="max-h-60 overflow-auto py-1">
                  {products.map((product) => (
                    <ListBox.Item
                      className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors hover:bg-[#91C1FA]/10 hover:text-[#91C1FA] data-[selected=true]:bg-[#91C1FA]/20 data-[selected=true]:font-medium data-[selected=true]:text-[#91C1FA] dark:text-slate-200 dark:hover:bg-sky-950/50 dark:data-[selected=true]:bg-sky-950/60"
                      id={product.id.toString()}
                      key={product.id}
                      textValue={product.name}
                    >
                      {product.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            {!isLoadingProducts && products.length === 0 ? (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                商品库暂无可选商品，请先在“商品基础信息库”中添加商品。
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-slate-300">文案类型</Label>
            <div className="inline-flex rounded-full bg-slate-100 p-1 dark:bg-slate-800/90 dark:ring-1 dark:ring-white/10">
              <button
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  value.copy_type === "marketing"
                    ? "bg-[#91C1FA] text-white dark:bg-sky-600"
                    : "text-gray-600 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    copy_type: "marketing",
                  })
                }
              >
                营销文案
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  value.copy_type === "guide"
                    ? "bg-[#91C1FA] text-white dark:bg-sky-600"
                    : "text-gray-600 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    copy_type: "guide",
                  })
                }
              >
                导购文案
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              最终确定文案
            </Label>
            <TextArea
              className="min-h-[180px] w-full rounded-2xl border border-gray-200 bg-white dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500"
              placeholder="请将你满意的文案确认后保存在这里"
              value={value.ad_best}
              onChange={(event) =>
                onChange({
                  ...value,
                  ad_best: event.target.value,
                })
              }
            />
          </div>
        </div>

        <Button
          className="mt-6 w-full rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-sky-600 dark:hover:bg-sky-500"
          isDisabled={!canSave || isSaving}
          isPending={isSaving}
          onPress={() => {
            void onSave()
          }}
        >
          <Save className="w-4 h-4 mr-2" />
          保存到商品营销素材库
        </Button>
      </Card.Content>
    </Card>
  )
}
