"use client";
import { Search, FileEdit, Image as ImageIcon } from "lucide-react";
import PageContainer from "@/components/layout/page-container";

export default function NotesPage() {
  const notes = [1, 2, 3, 4, 5, 6];

  return (
    <PageContainer title="营销笔记发布">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
          <input className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm" placeholder="搜索营销笔记..." />
        </div>
        <button className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl shadow-md transition-colors">
          <FileEdit className="w-4 h-4 mr-1" /> 写笔记
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {notes.map((i) => (
          <div key={i} className="w-full bg-white rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform shadow-sm cursor-pointer border border-gray-100">
            <div className="h-48 bg-gray-50 flex items-center justify-center text-gray-400 w-full border-b border-gray-100">
              <ImageIcon className="w-10 h-10 opacity-30" />
            </div>
            <div className="p-4 text-left">
              <h4 className="font-bold text-gray-800 text-lg">高转化爆款文案技巧 #{i}</h4>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                记录了如何通过AI大模型工具快速生成吸引年轻人的高转化率电商文案，适用于小红书等平台...
              </p>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
