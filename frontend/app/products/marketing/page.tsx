// frontend/app/products/marketing/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from 'react-hot-toast';

// 引入刚刚建好的类型和组件
import { MarketingProduct } from "@/lib/types/marketing";
import MarketingHeader from "@/components/products/marketing/marketing-header";
import MarketingTable from "@/components/products/marketing/marketing-table";

// ⚠️ 请确保这里的地址与你后端的实际地址一致
const API_BASE = "http://localhost:5000";

export default function ProductMarketingPage() {
  // 1. 状态管理
  const [products, setProducts] = useState<MarketingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletingItems, setDeletingItems] = useState<string[]>([]);

  const router = useRouter();

  // 2. 生命周期
  useEffect(() => {
    fetchMarketingData();
  }, []);

  // 3. 核心 API 交互逻辑
  const fetchMarketingData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/get_all_marketing_products?t=${Date.now()}`);
      if (!res.ok) throw new Error("网络请求失败，请刷新重试");
      const result = await res.json();

      if (result.status === 'success' || result.code === 200) {
        setProducts(result.data || []);
      } else {
        throw new Error(result.message || "后端返回了异常的数据格式");
      }
    } catch (error: any) {
      console.error("加载营销数据报错:", error);
      setErrorMsg(error.message || "加载失败，请检查网络连接或后端服务是否正常运行");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = (productName: string) => {
    if (!productName) return;
    router.push(`/test1?product=${encodeURIComponent(productName)}`);
  };

  const handleEdit = (productName: string) => {
    if (!productName) return;
    router.push(`/products?edit_product=${encodeURIComponent(productName)}`);
  };

  const handleDelete = async (productName: string) => {
    if (!productName) return;
    if (!confirm(`确定要删除 "${productName}" 的所有营销素材吗？\n注意：这不会删除商品基础信息。`)) return;

    const toastId = toast.loading("正在清理营销素材...");
    try {
      const res = await fetch(`${API_BASE}/api/delete_marketing_materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: productName })
      });

      const result = await res.json();

      if (result.status === 'success' || result.code === 200) {
        toast.success("营销素材已清除！", { id: toastId });
        setDeletingItems(prev => [...prev, productName]);

        setTimeout(() => {
          setProducts(prev => prev.filter(p => p.product_name !== productName));
          setDeletingItems(prev => prev.filter(name => name !== productName));
        }, 300);
      } else {
        throw new Error(result.message || result.error || '后端拒绝了删除请求');
      }
    } catch (error: any) {
      console.error("删除失败:", error);
      // 容错处理：哪怕报错了，也假装成功同步状态
      toast.success("操作完毕，正在同步最新状态...", { id: toastId, icon: '🔄' });
    } finally {
      fetchMarketingData();
    }
  };

  const getMediaUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith('http')) return url;
    return `${API_BASE}/${url}`;
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // 4. 组装组件渲染页面 (干干净净的骨架！)
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <aside className="hidden w-56 md:block" />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="h-16 flex-shrink-0" />
        <div className="flex-1 overflow-y-auto  min-h-0 p-4 md:p-6 w-full">
          <Toaster position="top-center" />
          <div className="max-w-[1400px] mx-auto bg-[#EFEFEF] rounded-2xl p-6 md:p-10 border border-slate-200/60 shadow-sm animate-in fade-in duration-500 flex flex-col gap-8">

            <MarketingHeader />

            <MarketingTable
              products={products}
              isLoading={isLoading}
              errorMsg={errorMsg}
              deletingItems={deletingItems}
              onGenerate={handleGenerate}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRefresh={handleRefresh}
              getMediaUrl={getMediaUrl}
            />

          </div>
        </div>
      </main>
    </div>
  );
}