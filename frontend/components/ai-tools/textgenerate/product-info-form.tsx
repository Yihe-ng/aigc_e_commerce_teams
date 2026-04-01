"use client"

import { useState } from "react"
import { Button, Card, Input, Label, TextField } from "@heroui/react"
import { Send } from "lucide-react"

interface ProductInfoFormProps {
  onSubmit: (data: {
    product_name: string
    product_desc: string
    target_audience: string
  }) => Promise<void>
}

export function ProductInfoForm({ onSubmit }: ProductInfoFormProps) {
  const [formData, setFormData] = useState({
    product_name: "",
    product_desc: "",
    target_audience: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!formData.product_name.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({ product_name: "", product_desc: "", target_audience: "" })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto">
      <Card className="bg-gray-50 border border-gray-100 rounded-2xl">
        <Card.Content className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            产品信息录入
          </h3>

          <div className="space-y-4">
            <TextField name="product_name" className="w-full">
              <Label className="text-sm font-medium text-gray-700">
                商品名称
              </Label>
              <Input
                value={formData.product_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    product_name: e.target.value,
                  }))
                }
                placeholder="请输入商品名称"
                className="bg-white border border-gray-200 rounded-lg"
                variant="secondary"
              />
            </TextField>

            <TextField name="product_desc" className="w-full">
              <Label className="text-sm font-medium text-gray-700">
                商品描述
              </Label>
              <Input
                value={formData.product_desc}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    product_desc: e.target.value,
                  }))
                }
                placeholder="请输入商品描述、卖点或特点"
                className="bg-white border border-gray-200 rounded-lg"
                variant="secondary"
              />
            </TextField>

            <TextField name="target_audience" className="w-full">
              <Label className="text-sm font-medium text-gray-700">
                目标人群
              </Label>
              <Input
                value={formData.target_audience}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    target_audience: e.target.value,
                  }))
                }
                placeholder="请输入目标用户画像或适用人群"
                className="bg-white border border-gray-200 rounded-lg"
                variant="secondary"
              />
            </TextField>
          </div>

          <Button
            onPress={handleSubmit}
            isDisabled={!formData.product_name.trim() || isSubmitting}
            className="w-full mt-6 bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
          >
            <Send className="w-4 h-4 mr-2" />
            保存产品信息
          </Button>
        </Card.Content>
      </Card>
    </div>
  )
}
