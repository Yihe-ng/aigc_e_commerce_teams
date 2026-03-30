// frontend/components/products/product-header.tsx

import React from 'react';

interface ProductHeaderProps {
  autoSaveMsg: string;
}

export default function ProductHeader({ autoSaveMsg }: ProductHeaderProps) {
  return (
    <div className="flex justify-between items-end pb-6 border-b border-slate-200/70">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">商品基础信息库</h1>
        <p className="text-slate-500 mt-2 text-sm">在这里添加或编辑将在 AIGC 中使用的商品基础信息。</p>
      </div>
      {/* 草稿提示小字 */}
      {autoSaveMsg && (
        <span className="text-emerald-500 text-xs font-medium animate-pulse flex items-center gap-1.5 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {autoSaveMsg}
        </span>
      )}
    </div>
  );
}