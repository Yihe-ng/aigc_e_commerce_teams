"use client"

import { Button, Card, Input, Label, TextArea, TextField } from "@heroui/react"
import { Save } from "lucide-react"

export interface SaveDraftValue {
  product_name: string
  copy_type: "marketing" | "guide"
  ad_best: string
}

interface SaveDraftPanelProps {
  value: SaveDraftValue
  isSaving?: boolean
  onChange: (value: SaveDraftValue) => void
  onSave: () => Promise<void> | void
}

export function SaveDraftPanel({
  value,
  isSaving = false,
  onChange,
  onSave,
}: SaveDraftPanelProps) {
  const canSave =
    value.product_name.trim().length > 0 && value.ad_best.trim().length > 0

  return (
    <Card className="bg-gray-50 border border-gray-100 rounded-2xl">
      <Card.Content className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">最终方案确认</h3>
          <p className="mt-1 text-sm text-gray-500">
            采纳后的文案会自动回填到这里，确认后可保存到商品营销素材库。
          </p>
        </div>

        <div className="space-y-4">
          <TextField className="w-full" name="product_name">
            <Label className="text-sm font-medium text-gray-700">商品名称</Label>
            <Input
              className="bg-white border border-gray-200 rounded-lg"
              placeholder="请输入商品名称"
              value={value.product_name}
              variant="secondary"
              onChange={(event) =>
                onChange({
                  ...value,
                  product_name: event.target.value,
                })
              }
            />
          </TextField>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">文案类型</Label>
            <div className="inline-flex rounded-full bg-slate-100 p-1">
              <button
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  value.copy_type === "marketing"
                    ? "bg-[#91C1FA] text-white"
                    : "text-gray-600"
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
                    ? "bg-[#91C1FA] text-white"
                    : "text-gray-600"
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
            <Label className="text-sm font-medium text-gray-700">
              最终确定文案
            </Label>
            <TextArea
              className="min-h-[180px] w-full rounded-2xl border border-gray-200 bg-white"
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
          className="w-full mt-6 bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
          isDisabled={!canSave || isSaving}
          isPending={isSaving}
          onPress={onSave}
        >
          <Save className="w-4 h-4 mr-2" />
          保存到商品营销素材库
        </Button>
      </Card.Content>
    </Card>
  )
}
