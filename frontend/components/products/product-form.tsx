"use client"

import type { ChangeEvent, DragEvent, FormEvent, RefObject } from "react"
import { Button, Card } from "@heroui/react"
import { Edit, PlusCircle, RotateCcw, Save, UploadCloud, X } from "lucide-react"

import type { Category, ProductFormValue } from "@/lib/types/product"

interface PreviewImage {
  file: File
  url: string
}

interface ProductFormProps {
  formData: ProductFormValue
  categories: Category[]
  editingId: string | number | null
  previewImages: PreviewImage[]
  uploadedUrls: string[]
  isUploading: boolean
  isSubmitting: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
  onRemovePreview: (url: string) => void
  onRemoveUploaded: (url: string) => void
  onReset: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  getImageUrl: (url?: string) => string
}

export default function ProductForm(props: ProductFormProps) {
  const {
    formData,
    categories,
    editingId,
    previewImages,
    uploadedUrls,
    isUploading,
    isSubmitting,
    fileInputRef,
    onChange,
    onFileSelect,
    onDrop,
    onRemovePreview,
    onRemoveUploaded,
    onReset,
    onSubmit,
    getImageUrl,
  } = props

  return (
    <Card className="overflow-visible rounded-3xl border border-slate-200/60 bg-[#F8F8F8] shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
      <form onSubmit={onSubmit}>
        <Card.Header className="flex items-center justify-between px-8 pb-2 pt-8">
          <div className="flex items-center gap-2.5">
            {editingId ? (
              <Edit className="h-5 w-5 text-amber-500" />
            ) : (
              <PlusCircle className="h-5 w-5 text-[#91C1FA]" />
            )}
            <Card.Title className="text-lg font-bold text-slate-800">
              {editingId ? "编辑商品信息" : "添加商品信息"}
            </Card.Title>
          </div>

          {editingId ? (
            <Button
              variant="ghost"
              size="sm"
              onPress={onReset}
              className="font-medium text-red-500 hover:bg-red-50"
            >
              <X className="mr-1 h-4 w-4" />
              退出编辑
            </Button>
          ) : null}
        </Card.Header>

        <Card.Content className="flex flex-col gap-8 px-8 py-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div className="grid grid-cols-1 gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  商品名称 <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  placeholder="请输入商品名称"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] outline-none transition-all placeholder:text-slate-400 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </label>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    商品类别 <span className="text-red-500">*</span>
                  </span>
                  <select
                    required
                    name="category"
                    value={formData.category}
                    onChange={onChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] outline-none transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">选择分类</option>
                    {categories.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    价格 <span className="text-red-500">*</span>
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      ¥
                    </span>
                    <input
                      required
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={onChange}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-4 text-sm text-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] outline-none transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">商品图片</span>
              <div
                className="flex min-h-[220px] flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all hover:border-blue-400 hover:bg-blue-50/50"
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDrop}
              >
                <label className="flex cursor-pointer flex-col items-center justify-center px-4 py-6 text-center">
                  <UploadCloud className="mb-2 h-8 w-8 text-blue-400" />
                  <p className="mb-1 text-sm text-slate-600">
                    <span className="font-semibold text-blue-500">点击选择</span> 或拖拽图片
                  </p>
                  <p className="text-xs text-slate-400">支持 JPG、PNG、WEBP，最大 20MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={onFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadedUrls.length > 0 || previewImages.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  {uploadedUrls.map((url) => (
                    <div key={url} className="group relative h-16 w-16 overflow-hidden rounded-md border border-slate-200 shadow-sm">
                      <img src={getImageUrl(url)} alt="已上传图片" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => onRemoveUploaded(url)}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {previewImages.map((item) => (
                    <div key={item.url} className="group relative h-16 w-16 overflow-hidden rounded-md border-2 border-blue-200 shadow-sm">
                      <img src={item.url} alt="待上传图片" className="h-full w-full object-cover opacity-80" />
                      <button
                        type="button"
                        onClick={() => onRemovePreview(item.url)}
                        className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                      <span className="absolute bottom-0 left-0 w-full truncate rounded-b-md bg-black/60 px-1 text-center text-[10px] text-white">
                        待上传
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">
                商品特点 <span className="text-red-500">*</span>
              </span>
              <textarea
                required
                name="features"
                value={formData.features}
                onChange={onChange}
                rows={5}
                placeholder="每行输入一个特点，这些特点会用于 AIGC 内容生成。"
                className="min-h-[140px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] outline-none transition-all placeholder:text-slate-400 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">
                详细描述 <span className="text-red-500">*</span>
              </span>
              <textarea
                required
                name="description"
                value={formData.description}
                onChange={onChange}
                rows={5}
                placeholder="请输入商品的详细描述信息，方便 AI 更全面地理解商品。"
                className="min-h-[140px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] outline-none transition-all placeholder:text-slate-400 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
        </Card.Content>

        <Card.Footer className="flex justify-end gap-4 rounded-b-3xl border-t border-slate-100/50 bg-slate-50/50 px-8 pb-8 pt-4">
          <Button
            type="button"
            variant="secondary"
            onPress={onReset}
            isDisabled={isSubmitting}
            className="rounded-xl border border-slate-200 bg-white px-8 font-medium text-slate-700 shadow-sm hover:bg-slate-100"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            重置清空
          </Button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-2 text-white shadow-lg transition-all ${
              isSubmitting
                ? "cursor-not-allowed bg-blue-400"
                : "bg-[#91C1FA] shadow-blue-500/20 hover:bg-[#7ab8fa]"
            }`}
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? (isUploading ? "正在上传图片..." : "正在保存...") : editingId ? "更新商品信息" : "保存新商品"}
          </button>
        </Card.Footer>
      </form>
    </Card>
  )
}
