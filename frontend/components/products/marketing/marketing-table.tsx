// frontend/components/marketing/marketing-table.tsx

import React from 'react';
import { Card, Spinner } from "@heroui/react";
import { List, Wand2, Edit, Trash2, ImageIcon, Film, SearchX } from "lucide-react";
import { MarketingProduct } from "@/lib/types/marketing";

interface MarketingTableProps {
  products: MarketingProduct[];
  isLoading: boolean;
  errorMsg: string | null;
  deletingItems: string[];
  onGenerate: (name: string) => void;
  onEdit: (name: string) => void;
  onDelete: (name: string) => void;
  onRefresh: () => void;
  getMediaUrl: (url?: string) => string;
}

export default function MarketingTable(props: MarketingTableProps) {
  const { products, isLoading, errorMsg, deletingItems, onGenerate, onEdit, onDelete, onRefresh, getMediaUrl } = props;

  return (
    <Card className="border-none shadow-xl bg-[#F8F8F8] rounded-xl overflow-hidden mt-6">
      <Card.Header className="pb-4 pt-8 px-8 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#91C1FA]/10 flex items-center justify-center text-[#91C1FA]">
            <List className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">已生成素材列表</h3>
        </div>
        {!isLoading && (
          <span className="text-sm text-gray-400 font-medium">共 {products.length} 个商品素材</span>
        )}
      </Card.Header>

      <Card.Content className="p-0">
        {isLoading ? (
          // 状态 1：正在加载
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Spinner size="lg" color="current" />
            <p className="text-gray-500 font-medium animate-pulse">正在加载营销数据，请稍候...</p>
          </div>
        ) : errorMsg ? (
          // 状态 2：网络错误提示与刷新按钮
          <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-red-50/30">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <span className="text-red-500 text-3xl font-bold">!</span>
            </div>
            <p className="text-red-500 font-medium text-lg">{errorMsg}</p>
            <button onClick={onRefresh} className="mt-4 font-bold px-8 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors">
              刷新页面重试
            </button>
          </div>
        ) : products.length === 0 ? (
          // 状态 3：空数据
          <div className="text-center py-24 text-gray-400 flex flex-col items-center">
            <SearchX className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">暂无营销素材</p>
            <p className="text-sm mt-1">请先前往“文案智造器”或“营销图创作”生成素材</p>
          </div>
        ) : (
          // 状态 4：展示数据
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600 table-fixed rounded-xl overflow-hidden">
              <thead className="text-xs text-gray-500 uppercase bg-[#EFEFEF] rounded-xl border-b border-slate-200">
                <tr>
                  <th scope="col" style={{ width: '12%' }} className="px-6 py-4 font-semibold tracking-wider">商品名称</th>
                  <th scope="col" style={{ width: '28%' }} className="px-6 py-4 font-semibold tracking-wider">营销文案</th>
                  <th scope="col" style={{ width: '25%' }} className="px-6 py-4 font-semibold tracking-wider text-center">商品海报</th>
                  <th scope="col" style={{ width: '25%' }} className="px-6 py-4 font-semibold tracking-wider text-center">营销视频</th>
                  <th scope="col" style={{ width: '10%' }} className="px-6 py-4 font-semibold tracking-wider text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product, index) => (
                  <tr
                    key={index}
                    className={`transition-all duration-300 group ${deletingItems.includes(product.product_name) ? 'opacity-0 scale-95 bg-red-50' : 'opacity-100 hover:bg-gray-100'}`}
                  >
                    <td className="px-6 py-6 font-bold text-gray-800 text-base truncate" title={product.product_name}>
                      {product.product_name || '未命名商品'}
                    </td>
                    <td className="px-6 py-6">
                      {product.marketing_text ? (
                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-slate-100  hover:line-clamp-none transition-all cursor-pointer">
                          {product.marketing_text}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">暂无文案</span>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex justify-center">
                        {product.posters && product.posters.length > 0 ? (
                          <div className="relative w-48 h-48 rounded-xl border border-slate-200 shadow-sm overflow-hidden group-hover:shadow-md transition-shadow">
                            <img src={getMediaUrl(product.posters[0].url)} alt="海报" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-gray-400 border border-slate-200 border-dashed">
                            <ImageIcon className="w-5 h-5 mb-1 opacity-50" />
                            <span className="text-[10px]">无海报</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex justify-center">
                        {product.videos && product.videos.length > 0 ? (
                          <div className="relative w-48 h-40 rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-black">
                            <video controls className="w-full h-full object-cover" preload="metadata">
                              <source src={getMediaUrl(product.videos[0].url)} type="video/mp4" />
                            </video>
                          </div>
                        ) : (
                          <div className="w-32 h-24 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-gray-400 border border-slate-200 border-dashed">
                            <Film className="w-5 h-5 mb-1 opacity-50" />
                            <span className="text-[10px]">无视频</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex justify-center gap-2 transition-opacity">
                        <button onClick={() => onGenerate(product.product_name)} className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 hover:text-purple-700 rounded-lg transition-colors shadow-sm" title="一键去生成文案">
                          <Wand2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onEdit(product.product_name)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors shadow-sm" title="去修改基础信息">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(product.product_name)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors shadow-sm" title="删除素材">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}