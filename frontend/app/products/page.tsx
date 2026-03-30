// frontend/app/products/page.tsx

"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

// 引入刚刚建好的组件
import { Product, Category } from "@/lib/types/product";
import ProductHeader from "@/components/products/product-header";
import ProductForm from "@/components/products/product-form";
import ProductTable from "@/components/products/product-table";

// ⚠️ 配置后端接口地址
const API_BASE = "http://localhost:5000";

export default function ProductManagementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-slate-500">加载中...</div>}>
      <ProductManagementContent />
    </Suspense>
  );
}

function ProductManagementContent() {
  const searchParams = useSearchParams();

  // 1. 所有的状态集中管理
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | number | null>(null);

  const [formData, setFormData] = useState({
    name: "", category: "", price: "", features: "", description: "",
  });

  const [previewImages, setPreviewImages] = useState<{ file: File; url: string }[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveMsg, setAutoSaveMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: Category[] = [
    { key: "服装", label: "服装" },
    { key: "电子产品", label: "电子产品" },
    { key: "食品", label: "食品" },
    { key: "美妆", label: "美妆" },
    { key: "其他", label: "其他" },
  ];

  // 2. 生命周期与特效
  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    if (!editingId) {
      const draft = localStorage.getItem("product_draft");
      if (draft) {
        try {
          setFormData(JSON.parse(draft));
          toast.success("已恢复上次编辑的草稿", { position: 'top-right' });
        } catch (e) { }
      }
    }
  }, [editingId]);

  useEffect(() => {
    if (!editingId && formData.name) {
      const timer = setTimeout(() => {
        localStorage.setItem("product_draft", JSON.stringify(formData));
        setAutoSaveMsg("已自动保存草稿");
        setTimeout(() => setAutoSaveMsg(""), 3000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, editingId]);

  useEffect(() => {
    const editProductName = searchParams?.get('edit_product');
    if (editProductName && products.length > 0 && !editingId) {
      const targetProduct = products.find(p => p.name === editProductName);
      if (targetProduct) {
        handleEdit(targetProduct.id);
        toast.success(`自动定位到商品：${editProductName}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [searchParams, products, editingId]);

  // 3. 核心交互逻辑 (传递给组件的方法)
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/get_products?t=${new Date().getTime()}`);
      if (!res.ok) throw new Error("网络请求失败");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      toast.error("加载商品列表失败");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPreviews = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
      setPreviewImages((prev) => [...prev, ...newPreviews]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      const newPreviews = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
      setPreviewImages((prev) => [...prev, ...newPreviews]);
    }
  };

  const removePreview = (url: string) => setPreviewImages((prev) => prev.filter((img) => img.url !== url));

  const removeUploaded = (url: string) => {
    if (confirm("确定要删除这张已上传的图片吗？")) {
      setUploadedUrls((prev) => prev.filter((u) => u !== url));
    }
  };

  const handleEdit = async (id: string | number) => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const toastId = toast.loading("加载详情...");
      const res = await fetch(`${API_BASE}/get_product_detail/${id}`);
      if (!res.ok) { toast.dismiss(toastId); throw new Error("获取详情失败"); }

      const data = await res.json();
      const product = data.product;

      setFormData({
        name: product.name || "",
        category: product.category || "",
        price: product.price ? product.price.toString() : "",
        features: Array.isArray(product.features) ? product.features.join("\n") : product.features || "",
        description: product.description || "",
      });
      setUploadedUrls(product.images || []);
      setPreviewImages([]);
      setEditingId(id);
      toast.success("加载成功！", { id: toastId });
    } catch (error) {
      toast.error("加载商品详情失败，请重试");
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm(`确定要永久删除这个商品吗？该操作不可逆！`)) return;
    const toastId = toast.loading("正在删除...");
    try {
      await fetch(`${API_BASE}/delete_product/${id}`, { method: 'DELETE' });
      toast.success("商品已永久删除！", { id: toastId });
    } catch (error) {
      toast.success("操作完毕，正在同步最新状态...", { id: toastId, icon: '🔄' });
    } finally {
      fetchProducts();
    }
  };

  const handleReset = () => {
    setFormData({ name: "", category: "", price: "", features: "", description: "" });
    setPreviewImages([]);
    setUploadedUrls([]);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("正在处理中...");

    try {
      setIsUploading(true);
      let newUploadedUrls: string[] = [];

      if (previewImages.length > 0) {
        toast.loading("正在上传图片...", { id: toastId });
        for (let item of previewImages) {
          const uploadData = new FormData();
          uploadData.append('file', item.file);
          const uploadRes = await fetch(`${API_BASE}/upload_image`, { method: 'POST', body: uploadData });
          if (!uploadRes.ok) throw new Error("部分图片上传失败");
          const result = await uploadRes.json();
          newUploadedUrls.push(result.image_url);
        }
      }

      const finalImages = [...uploadedUrls, ...newUploadedUrls];
      const payload = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        features: formData.features.split('\n').filter(f => f.trim() !== ''),
        description: formData.description,
        images: finalImages
      };

      const url = editingId ? `${API_BASE}/save_product/${editingId}` : `${API_BASE}/save_product`;
      const method = editingId ? 'PUT' : 'POST';

      toast.loading("正在保存商品数据...", { id: toastId });
      const saveRes = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!saveRes.ok) throw new Error("保存接口报错");

      toast.success(editingId ? "商品更新成功！" : "商品添加成功！", { id: toastId });
      if (!editingId) localStorage.removeItem("product_draft");

      handleReset();
      fetchProducts();
    } catch (error: any) {
      toast.error(`操作失败: ${error.message}`, { id: toastId });
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  const getImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith('http')) return url;
    return `${API_BASE}/${url}`;
  };

  // 4. 组装组件 (现在的 page.tsx 是不是干净得让人想哭？)
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <aside className="hidden w-56 md:block" />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="h-16 flex-shrink-0" />
        <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 w-full">
          <Toaster position="top-center" />

          <div className="max-w-[1400px] mx-auto bg-[#EFEFEF] rounded-2xl p-6 md:p-10 border border-slate-200/60 shadow-sm animate-in fade-in duration-500 flex flex-col gap-8">

            {/* 顶部标题区 */}
            <ProductHeader autoSaveMsg={autoSaveMsg} />

            {/* 添加/编辑表单区 */}
            <ProductForm
              formData={formData}
              categories={categories}
              editingId={editingId}
              previewImages={previewImages}
              uploadedUrls={uploadedUrls}
              isUploading={isUploading}
              isSubmitting={isSubmitting}
              fileInputRef={fileInputRef}
              onChange={handleInputChange}
              onFileSelect={handleFileSelect}
              onDrop={handleDrop}
              onRemovePreview={removePreview}
              onRemoveUploaded={removeUploaded}
              onReset={handleReset}
              onSubmit={handleSubmit}
              getImageUrl={getImageUrl}
            />

            {/* 商品列表区 */}
            <ProductTable
              products={products}
              onEdit={handleEdit}
              onDelete={handleDelete}
              getImageUrl={getImageUrl}
            />

          </div>
        </div>
      </main>
    </div>
  );
}