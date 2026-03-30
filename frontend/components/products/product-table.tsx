// frontend/components/products/product-table.tsx

import React from 'react';
import { Card } from "@heroui/react";
import { List, Edit, Trash2, SearchX } from "lucide-react";
import { Product } from "@/lib/types/product";

interface ProductTableProps {
  products: Product[];
  onEdit: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  getImageUrl: (url?: string) => string;
}

export default function ProductTable({ products, onEdit, onDelete, getImageUrl }: ProductTableProps) {
  return (
    <Card className="border-none shadow-xl bg-[#F8F8F8] rounded-2xl overflow-hidden mt-8">
      <Card.Header className="pb-4 pt-8 px-8 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
            <List className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">已入库商品列表</h3>
        </div>
        <span className="text-sm text-slate-400 font-medium">共 {products.length} 件商品</span>
      </Card.Header>

      <Card.Content className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 table-fixed rounded-xl overflow-hidden">
            <thead className="text-xs text-slate-500 uppercase bg-[#EFEFEF] border-b border-slate-200 ">
              <tr>
                <th scope="col" style={{ width: '12%' }} className="px-8 py-4 font-semibold tracking-wider">主图</th>
                <th scope="col" style={{ width: '20%' }} className="px-6 py-4 font-semibold tracking-wider">名称</th>
                <th scope="col" style={{ width: '15%' }} className="px-6 py-4 font-semibold tracking-wider">类别</th>
                <th scope="col" style={{ width: '10%' }} className="px-6 py-4 font-semibold tracking-wider">价格</th>
                <th scope="col" style={{ width: '28%' }} className="px-6 py-4 font-semibold tracking-wider">特点</th>
                <th scope="col" style={{ width: '15%' }} className="px-8 py-4 font-semibold tracking-wider text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-100 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs shadow-sm overflow-hidden">
                      {product.main_image || (product.images && product.images[0]) ? (
                        <img src={getImageUrl(product.main_image || product.images![0])} alt="主图" className="w-full h-full object-cover" />
                      ) : (
                        <span>暂无</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800 truncate" title={product.name}>{product.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 text-blue-600 font-bold">¥ {parseFloat(product.price as any).toFixed(2)}</td>
                  <td className="px-6 py-4 max-w-[200px] truncate text-slate-500" title={typeof product.features === 'string' ? product.features : product.features.join(' ')}>
                    {Array.isArray(product.features) ? product.features.join(' | ') : product.features}
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex justify-center gap-3 transition-opacity">
                      <button onClick={() => onEdit(product.id)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors shadow-sm" title="编辑">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(product.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors shadow-sm" title="删除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {products.length === 0 && (
          <div className="text-center py-16 text-slate-400 flex flex-col items-center">
            <List className="w-12 h-12 mb-3 text-slate-200" />
            <p>暂无商品数据，请在上方添加</p>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}