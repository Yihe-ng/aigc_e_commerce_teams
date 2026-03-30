// frontend/components/products/product-form.tsx

import React from 'react';
import { Card, Button } from "@heroui/react";
import { PlusCircle, Save, RotateCcw, UploadCloud, Edit, X } from "lucide-react";
import { Category } from "@/lib/types/product";
import { ChevronDown, FolderTree } from "lucide-react";

interface ProductFormProps {
  formData: any;
  categories: Category[];
  editingId: string | number | null;
  previewImages: { file: File; url: string }[];
  uploadedUrls: string[];
  isUploading: boolean;
  isSubmitting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemovePreview: (url: string) => void;
  onRemoveUploaded: (url: string) => void;
  onReset: () => void;
  onSubmit: (e: React.FormEvent) => void;
  getImageUrl: (url?: string) => string;
}

export default function ProductForm(props: ProductFormProps) {
  const { formData, categories, editingId, previewImages, uploadedUrls, isUploading, isSubmitting, fileInputRef, onChange, onFileSelect, onDrop, onRemovePreview, onRemoveUploaded, onReset, onSubmit, getImageUrl } = props;

  const [isCategoryOpen, setIsCategoryOpen] = React.useState(false);

  return (
    <Card className="border border-slate-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] bg-[#F8F8F8] rounded-xl overflow-visible">
      <form onSubmit={onSubmit}>
        <Card.Header className="pb-2 pt-8 px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {editingId ? <Edit className="w-5 h-5 text-amber-500" /> : <PlusCircle className="w-5 h-5 text-[#91C1FA]" />}
            <h3 className="text-lg font-bold text-gray-800">
              {editingId ? "编辑商品信息" : "添加商品信息"}
            </h3>
          </div>
          {editingId && (
            <Button variant="ghost" size="sm" onPress={onReset} className="text-red-500 hover:bg-red-50 font-medium">
              <X className="w-4 h-4 mr-1" /> 退出编辑
            </Button>
          )}
        </Card.Header>

        <Card.Content className="px-8 py-6 flex flex-col gap-8">

          {/* 第一行：名称/类别/价格 + 图片 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch">

            {/* 左侧信息区 (占2列) */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* 商品名称 */}
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-700 text-sm">商品名称 <span className="text-red-500">*</span></label>
                <input
                  required
                  name="name"
                  value={formData.name || ""}
                  onChange={onChange}
                  type="text"
                  placeholder="请输入商品名称"
                  className="w-[530px] px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-[0_2px_4px_rgba(0,0,0,0.01)] text-gray-700 placeholder:text-gray-400"
                />
              </div>

              {/* 商品类别 */}
              <div className="flex flex-col gap-2 relative">
                <label className="font-semibold text-slate-700 text-sm">商品类别 <span className="text-red-500">*</span></label>

                {/* 伪装的触发按钮 (其实是个 div) */}
                <div
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="w-[530px] flex items-center justify-between px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-white cursor-pointer transition-all shadow-[0_2px_4px_rgba(0,0,0,0.01)] text-slate-700"
                >
                  <div className="flex items-center gap-2 text-slate-600">
                    <FolderTree className="w-4 h-4 opacity-60" />
                    <span className={formData.category ? "text-slate-700" : "text-slate-400"}>
                      {formData.category
                        ? categories.find(c => c.key === formData.category)?.label
                        : "选择分类"}
                    </span>
                  </div>
                  {/* 右侧小箭头，打开时自动翻转 180 度 */}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* 绝对定位的下拉面板 (点击后才会弹出来) */}
                {isCategoryOpen && (
                  <div className="absolute top-[72px] left-0 w-[600px] bg-white border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                    {categories.map((cat) => (
                      <div
                        key={cat.key}
                        onClick={() => {
                          // 模拟一个事件对象传给你的 onChange 函数，骗过 React
                          onChange({ target: { name: 'category', value: cat.key } } as any);
                          setIsCategoryOpen(false); // 选完自动关闭菜单
                        }}
                        className="px-6 py-3.5 hover:bg-slate-50 cursor-pointer text-slate-600 hover:text-slate-900 text-sm transition-colors flex items-center justify-between"
                      >
                        {cat.label}
                        {/* 如果当前选中了这一项，打个蓝色小勾 */}
                        {formData.category === cat.key && (
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 价格 */}
              <div className="w-full md:w-1/2 pr-3 flex flex-col gap-2">
                <label className="font-semibold text-gray-700 text-sm">价格 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">¥</span>
                  <input
                    required
                    name="price"
                    value={formData.price || ""}
                    onChange={onChange}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-[530px] pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-[0_2px_4px_rgba(0,0,0,0.01)] text-gray-700"
                  />
                </div>
              </div>

            </div>

            {/* 右侧图片区 (等高) */}
            <div className="lg:col-span-1 flex flex-col gap-2 h-full lg:ml-[-200px]">
              <label className="block text-sm font-semibold text-gray-700">商品图片</label>

              {/* 拖拽上传框 */}
              <div
                className="flex items-center justify-center w-full flex-1"
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
              >
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-full border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-400 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <UploadCloud className="w-8 h-8 mb-2 text-blue-400 group-hover:text-blue-500 transition-colors" />
                    <p className="mb-1 text-sm text-gray-600"><span className="font-semibold text-blue-500">点击选择</span> 或拖拽图片</p>
                    <p className="text-xs text-gray-400">支持 JPG, PNG, WEBP (最大20MB)</p>
                  </div>
                  <input id="dropzone-file" type="file" multiple accept="image/*" onChange={onFileSelect} ref={fileInputRef} className="hidden" />
                </label>
              </div>

              {/* 预览九宫格 */}
              {(previewImages.length > 0 || uploadedUrls.length > 0) && (
                <div className="flex flex-wrap gap-3 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">

                  {uploadedUrls.map((url, idx) => (
                    <div key={`uploaded-${idx}`} className="relative w-16 h-16 rounded-md border border-slate-200 shadow-sm group">
                      <img src={getImageUrl(url)} className="w-full h-full object-cover rounded-md" alt="已上传" />
                      <button type="button" onClick={() => onRemoveUploaded(url)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {previewImages.map((item, idx) => (
                    <div key={`preview-${idx}`} className="relative w-16 h-16 rounded-md border-2 border-blue-200 shadow-sm group">
                      <img src={item.url} className="w-full h-full object-cover rounded-md opacity-80" alt="待上传" />
                      <button type="button" onClick={() => onRemovePreview(item.url)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                        <X size={14} />
                      </button>
                      <span className="absolute bottom-0 left-0 w-full text-[10px] text-center bg-black/60 text-white truncate px-1 rounded-b-md">待上传</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 第二行：特点 + 详细描述 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* 商品特点 */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700 text-sm">商品特点 <span className="text-red-500">*</span></label>
              <textarea
                required
                name="features"
                value={formData.features || ""}
                onChange={onChange}
                placeholder="每行输入一个特点，这些特点将用于 AIGC 内容生成..."
                rows={4}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-[0_2px_4px_rgba(0,0,0,0.01)] resize-y text-gray-700 placeholder:text-gray-400"
              />
            </div>

            {/* 详细描述 */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-700 text-sm">详细描述 <span className="text-red-500">*</span></label>
              <textarea
                required
                name="description"
                value={formData.description || ""}
                onChange={onChange}
                placeholder="请输入商品的详细描述信息，方便 AI 更全面地了解商品..."
                rows={4}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-[0_2px_4px_rgba(0,0,0,0.01)] resize-y text-gray-700 placeholder:text-gray-400"
              />
            </div>

          </div>

        </Card.Content>

        <Card.Footer className="px-8 pb-8 pt-4 flex gap-4 justify-end bg-slate-50/50 rounded-b-2xl border-t border-slate-100/50">
          <Button
            type="button"
            variant="secondary"
            onPress={onReset}
            isDisabled={isSubmitting}
            className="font-medium bg-white border border-slate-200 hover:bg-slate-100 text-gray-700 flex items-center gap-2 px-8 shadow-sm rounded-xl"
          >
            <RotateCcw className="w-4 h-4" />
            重置清空
          </Button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`font-medium text-white shadow-lg flex items-center justify-center gap-2 px-8 py-2 rounded-xl transition-all ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#91C1FA] hover:bg-[#7Ab8FA] shadow-blue-500/20'}`}
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? (isUploading ? "正在上传图片..." : "正在保存...") : (editingId ? "更新商品信息" : "保存新商品")}
          </button>
        </Card.Footer>
      </form>
    </Card>
  );
}