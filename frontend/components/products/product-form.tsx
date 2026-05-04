"use client"

import type { ChangeEvent, DragEvent, FormEvent, RefObject } from "react"
import { Button, Card, Chip, Input, Spinner } from "@heroui/react"
import { Edit, PlusCircle, RotateCcw, Save, Sparkles, Trash2, UploadCloud, X } from "lucide-react"

import type { Category, ProductFormValue, SizeChartRow } from "@/lib/types/product"
import { ImageCarousel } from "./image-carousel"

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
  onSizeToggle: (size: string) => void
  onColorToggle: (color: string) => void
  onFitChange: (fit: string) => void
  onFabricChange: (fabric: string) => void
  onSizeChartChange: (chart: SizeChartRow[]) => void
  onGenerateDescription: () => void
  isGeneratingDescription: boolean
}

const MAX_IMAGES = 5

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
    onSizeToggle,
    onColorToggle,
    onFitChange,
    onFabricChange,
    onSizeChartChange,
    onGenerateDescription,
    isGeneratingDescription,
  } = props

  // 处理文件选择，添加数量限制检查
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return

    const files = Array.from(event.target.files)
    const currentCount = uploadedUrls.length + previewImages.length

    if (currentCount + files.length > MAX_IMAGES) {
      alert(`最多只能上传 ${MAX_IMAGES} 张图片，当前已有 ${currentCount} 张`)
      // 清空 input 以便可以再次选择
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    onFileSelect(event)
  }

  // 处理拖拽上传，添加数量限制检查
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files ?? [])
    const currentCount = uploadedUrls.length + previewImages.length

    if (currentCount + files.length > MAX_IMAGES) {
      alert(`最多只能上传 ${MAX_IMAGES} 张图片，当前已有 ${currentCount} 张`)
      return
    }

    onDrop(event as unknown as DragEvent<HTMLDivElement>)
  }

  // 准备 Carousel 需要的图片数据
  const carouselImages = [
    ...uploadedUrls.map((url) => ({ url, isPreview: false })),
    ...previewImages.map((item) => ({ url: item.url, isPreview: true })),
  ]

  const currentImageCount = uploadedUrls.length + previewImages.length

  return (
    <Card className="w-full rounded-2xl border-0 bg-[#EFEFEF] shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:bg-slate-900/85 dark:shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
      <form onSubmit={onSubmit}>
        <Card.Header className="border-b border-gray-200 px-6 py-2.5 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            {editingId ? (
              <Edit className="h-5 w-5 text-amber-500" />
            ) : (
              <PlusCircle className="h-5 w-5 text-[#91C1FA]" />
            )}
            <Card.Title className="text-lg font-semibold text-gray-800 dark:text-slate-100">
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

        <Card.Content className="space-y-4 px-6 pb-6 pt-2.5">
          {/* 上半部分：基础信息 + 图片 - 四六开布局 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
            {/* 左侧：表单字段垂直堆叠 */}
            <div className="flex flex-col gap-5">
              {/* 商品名称 - 双倍高度 */}
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  商品名称 <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  placeholder="请输入商品名称"
                  className="h-20 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] outline-none transition-all placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </label>

              {/* 商品类别 */}
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  商品类别 <span className="text-red-500">*</span>
                </span>
                <select
                  required
                  name="category"
                  value={formData.category}
                  onChange={onChange}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] outline-none transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500"
                >
                  <option value="">选择分类</option>
                  {categories.map((category) => (
                    <option key={category.key} value={category.key}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* 价格 */}
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  价格 <span className="text-red-500">*</span>
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
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
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white py-3 pl-9 pr-4 text-sm text-gray-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] outline-none transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </label>
            </div>

            {/* 右侧：图片区域 - 上传框 + Carousel 预览 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">商品图片</span>
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  {currentImageCount} / {MAX_IMAGES} 张
                </span>
              </div>

              {/* 左右布局：上传框 + Carousel - 固定高度 240px */}
              <div className="flex h-[240px] gap-4">
                {/* 左侧：上传框（28%） */}
                <div className="h-full w-[28%]">
                  <label
                    className="flex h-full cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-sky-500 dark:hover:bg-slate-800/80"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                  >
                    <UploadCloud className="mb-2 h-8 w-8 text-blue-400" />
                    <p className="mb-1 text-center text-sm text-gray-600 dark:text-slate-300">
                      <span className="font-semibold text-blue-500 dark:text-sky-400">点击选择</span>
                    </p>
                    <p className="text-center text-xs text-gray-400 dark:text-slate-500">或拖拽图片</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 右侧：Carousel 预览区（72%） */}
                <div className="h-full flex-1">
                  <ImageCarousel
                    images={carouselImages}
                    maxCount={MAX_IMAGES}
                    onRemove={(url) => {
                      // 判断是已上传还是预览图
                      if (uploadedUrls.includes(url)) {
                        onRemoveUploaded(url)
                      } else {
                        onRemovePreview(url)
                      }
                    }}
                    getImageUrl={getImageUrl}
                  />
                </div>
              </div>

              {/* 提示信息 */}
              <p className="text-xs text-gray-400 dark:text-slate-500">支持 JPG、PNG、WEBP，最大 20MB</p>
            </div>
          </div>

          {/* 下半部分：商品特点和详细描述 */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                商品特点 <span className="text-red-500">*</span>
              </span>
              <textarea
                required
                name="features"
                value={formData.features}
                onChange={onChange}
                rows={5}
                placeholder="每行输入一个特点，这些特点会用于 AIGC 内容生成。"
                className="min-h-[140px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] outline-none transition-all placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </label>

            <label className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  详细描述 <span className="text-red-500">*</span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  isDisabled={!formData.name.trim() || !formData.category || !formData.features.trim() || isGeneratingDescription}
                  onPress={onGenerateDescription}
                >
                  {isGeneratingDescription ? (
                    <>
                      <Spinner size="sm" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      AI 生成
                    </>
                  )}
                </Button>
              </div>
              <textarea
                required
                name="description"
                value={formData.description}
                onChange={onChange}
                rows={5}
                placeholder="请输入商品的详细描述信息，方便 AI 更全面地理解商品。"
                className="min-h-[140px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-700 shadow-[0_2px_4px_rgba(0,0,0,0.01)] outline-none transition-all placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </label>
          </div>

          {/* 尺码信息 */}
          <div className="space-y-4">
            <Card.Title className="text-base font-semibold text-gray-700 dark:text-slate-300">尺码信息</Card.Title>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">可选尺码</span>
                <div className="flex flex-wrap gap-2">
                  {["S", "M", "L", "XL", "XXL", "均码"].map((size) => (
                    <Chip
                      key={size}
                      size="sm"
                      variant={(formData.sizes || []).includes(size) ? "solid" : "flat"}
                      color={(formData.sizes || []).includes(size) ? "primary" : "default"}
                      className="cursor-pointer select-none"
                      onClick={() => onSizeToggle(size)}
                    >
                      {size}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">颜色选项</span>
                <div className="flex flex-wrap gap-2">
                  {["白色", "黑色", "红色", "蓝色", "灰色", "米色"].map((color) => (
                    <Chip
                      key={color}
                      size="sm"
                      variant={(formData.colors || []).includes(color) ? "solid" : "flat"}
                      color={(formData.colors || []).includes(color) ? "primary" : "default"}
                      className="cursor-pointer select-none"
                      onClick={() => onColorToggle(color)}
                    >
                      {color}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">版型</span>
                <select
                  value={formData.fit}
                  onChange={(e) => onFitChange(e.target.value)}
                  className="h-8 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100"
                >
                  <option value="">选择版型</option>
                  {["标准版型", "修身", "宽松", "oversized"].map((fit) => (
                    <option key={fit} value={fit}>
                      {fit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">面料</span>
                <Input
                  size="sm"
                  variant="bordered"
                  placeholder="如：100%棉、雪纺、牛仔布"
                  value={formData.fabric || ""}
                  className="text-sm"
                  onChange={(e) => onFabricChange(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/80">
                      <th className="px-2 py-2 text-left font-semibold text-gray-600 dark:text-slate-400">尺码</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600 dark:text-slate-400">胸围</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600 dark:text-slate-400">腰围</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600 dark:text-slate-400">臀围</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600 dark:text-slate-400">肩宽</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600 dark:text-slate-400">袖长</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600 dark:text-slate-400">衣长</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600 dark:text-slate-400">建议体重</th>
                      <th className="w-8 px-1 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.size_chart || []).map((row, index) => (
                      <tr
                        key={`${row.尺码 || "new"}-${index}`}
                        className="border-b border-gray-100 last:border-0 dark:border-slate-700/50"
                      >
                        <td className="px-2 py-1">
                            <Input
                              size="sm"
                              variant="flat"
                              value={row.尺码}
                              placeholder="如：M"
                              className="text-xs h-7"
                              onChange={(e) => {
                              const updated = [...formData.size_chart]
                              updated[index] = { ...row, 尺码: e.target.value }
                              const existingSizes = new Set(updated.map((r) => r.尺码).filter(Boolean))
                              const syncSizes = ["S", "M", "L", "XL", "XXL", "均码"].filter((s) => existingSizes.has(s))
                              const sizes = formData.sizes || []
                              syncSizes.forEach((s) => {
                                if (!sizes.includes(s)) onSizeToggle(s)
                              })
                              sizes.forEach((s) => {
                                if (!existingSizes.has(s)) onSizeToggle(s)
                              })
                              onSizeChartChange(updated)
                            }}
                          />
                        </td>
                        {(["胸围", "腰围", "臀围", "肩宽", "袖长", "衣长"] as const).map((field) => (
                          <td key={field} className="px-2 py-1">
                              <Input
                                size="sm"
                                variant="flat"
                                type="number"
                                value={row[field] === "" ? "" : String(row[field])}
                                placeholder="-"
                                className="text-xs h-7"
                              onChange={(e) => {
                                const updated = [...formData.size_chart]
                                const val = e.target.value === "" ? "" : Number(e.target.value)
                                updated[index] = { ...row, [field]: val }
                                onSizeChartChange(updated)
                              }}
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1">
                            <Input
                              size="sm"
                              variant="flat"
                              value={row.建议体重}
                              placeholder="如：50-60kg"
                              className="text-xs h-7"
                            onChange={(e) => {
                              const updated = [...formData.size_chart]
                              updated[index] = { ...row, 建议体重: e.target.value }
                              onSizeChartChange(updated)
                            }}
                          />
                        </td>
                        <td className="px-1 py-1 text-center">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            className="h-6 w-6 min-w-6"
                            onPress={() => {
                              const updated = (formData.size_chart || []).filter((_, i) => i !== index)
                              onSizeChartChange(updated)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                size="sm"
                variant="bordered"
                color="primary"
                onPress={() => {
                  const newRow: SizeChartRow = {
                    尺码: "",
                    胸围: "",
                    腰围: "",
                    臀围: "",
                    肩宽: "",
                    袖长: "",
                    衣长: "",
                    建议体重: "",
                  }
                  onSizeChartChange([...(formData.size_chart || []), newRow])
                }}
              >
                新增尺码行 <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card.Content>

        <Card.Footer className="flex justify-end gap-4 border-t border-gray-200 px-6 pb-6 pt-4 dark:border-slate-700">
          <Button
            type="button"
            variant="secondary"
            onPress={onReset}
            isDisabled={isSubmitting}
            className="rounded-xl border border-gray-200 bg-white px-6 font-medium text-gray-700 shadow-sm hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            重置清空
          </Button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2 text-white shadow-lg transition-all ${
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
