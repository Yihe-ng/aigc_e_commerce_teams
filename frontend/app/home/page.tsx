"use client";

import { Card } from "@heroui/react";
import { Maximize2, X } from "lucide-react"; // 用于模拟卡片右上角的图标

export default function HomePage() {
  const features = [
    "知识库+大语言模型",
    "文生图片技术",
    "文生视频技术",
    "数字人直播带货",
    "小红书、微博等平台营销",
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <aside className="hidden w-56 md:block" />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="h-16 flex-shrink-0" />

        <div className="flex-1 overflow-y-auto !bg-[#F1F3FA] min-h-screen relative w-full">

          {/* 装饰性背景波浪 (还原原版的 SVG 波浪) */}
          <div className="absolute top-[60%] left-0 w-full h-36 -translate-y-1/2 overflow-hidden pointer-events-none z-0">
            <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,100 Q250,50 500,100 T1000,100" fill="none" stroke="#dbeafe" strokeWidth="4" opacity="0.8" />
              <path d="M0,110 Q250,160 500,110 T1000,110" fill="none" stroke="#dbeafe" strokeWidth="2" opacity="0.4" />
            </svg>
          </div>
          <div className="absolute top-[65%] left-0 w-full h-36 -translate-y-1/2 overflow-hidden pointer-events-none z-0">
            <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,100 Q250,50 500,100 T1000,100" fill="none" stroke="#dbeafe" strokeWidth="4" opacity="0.8" />
              <path d="M0,110 Q250,160 500,110 T1000,110" fill="none" stroke="#dbeafe" strokeWidth="2" opacity="0.4" />
            </svg>
          </div>

          {/* 主内容区 */}
          <div className="relative z-10 w-full">

            {/* ================= 顶部标题区域 (.presentation) ================= */}
            {/* 还原了原来的浅蓝色背景和内边距 */}
            <div className="bg-[#D9EAFD] px-12 py-16 mb-8 w-full -mt-5">
              <h1 className="text-[38px] font-semibold text-[#1e4c99] font-sans">
                智创电商营销系统
              </h1>
              <h4 className="text-3xl font-normal text-[#4e4e4e] mt-2 mb-4">
                基于 AIGC 的新电商数字化营销技术研究与创新应用
              </h4>

              {/* 横向排列的标签组 */}
              <div className="flex flex-wrap gap-2.5 mt-4">
                {features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-slate-700 bg-[rgb(194,224,255)]/80 backdrop-blur-md"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* ================= 下方三大卡片区域 (带倾斜和渐变动效) ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 pt-10 pb-16 items-stretch relative">

              {/* 卡片 1：项目简介 (白色，左倾) */}
              <Card
                className="border-none shadow-[0_15px_30px_rgba(110,133,255,0.1)] bg-white transform lg:-rotate-3 hover:rotate-0 hover:-translate-y-1 hover:scale-100 hover:shadow-[0_20px_40px_rgba(110,133,255,0.2)] transition-all duration-300 z-10 hover:z-30 w-[400px] h-[350px] flex flex-col ml-5 mt-4 rounded-3xl"
                style={{
                  background: 'linear-gradient(to top, #d2dbe8ff 0%, white 100%)'
                }}
              >
                <Card.Header className="pb-0 pt-3 px-8 flex justify-between items-start">
                  <h3 className="text-xl font-bold text-slate-900 tracking-wide">项目简介</h3>
                </Card.Header>
                <Card.Content className="px-8 pt-4 pb-6 flex-grow">
                  <h4 className="text-xl font-semibold text-gray-500 mb-3">基于 AIGC 的新电商数字化营销技术研究与创新应用</h4>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    随着生成式人工智能（AIGC）技术的快速发展，电商产业迎来了一次潜在的变革和更新。<br />
                    本项目利用 AI 技术加速电商行业的自动化，并实现产品文案、宣传图、视频内容的智能化生成，同时借助数字人进行直播带货，从而推动电商产业的转型升级。
                  </p>
                </Card.Content>
                <Card.Footer className="px-8 pb-8 pt-0 text-xs text-slate-400 font-medium">
                  AIGC
                </Card.Footer>
              </Card>

              {/* 卡片 2：功能概览 (硬边缘蓝紫渐变，默认放大，层级最高) */}
              <Card
                className="border-none text-white transform lg:scale-105 z-20 hover:scale-107 hover:-translate-y-1 transition-all duration-300 h-[400px]  w-[400px] relative left-[10px] flex flex-col rounded-3xl shadow-[0_20px_50px_rgba(107,133,255,0.4)]"
                style={{
                  background: 'linear-gradient(105deg,#6bb9ff 0%,#6baeff 42%,#85b7ff 42%,#85c0ff 58%,#76b7ff 58%,#76c0ff 100%)'

                }}
              >
                <Card.Header className="pb-0 pt-3 px-8 flex justify-between items-start">
                  <h3 className="text-xl font-bold text-white tracking-wide -mt-4">功能概览</h3>
                </Card.Header>
                <Card.Content className="px-8 pt-4 pb-6 flex-grow">
                  <h4 className="text-base font-semibold text-white/90 mb-4">我们拥有以下功能：</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-white/90 text-sm leading-relaxed"><span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm"></span>大语言模型，解决传统电商行业中文案制作、编辑等问题;</li>
                    <li className="flex items-start gap-2 text-white/90 text-sm leading-relaxed"><span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm"></span>文生图片技术，实现宣传图或产品描述图的智能生成;</li>
                    <li className="flex items-start gap-2 text-white/90 text-sm leading-relaxed"><span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm"></span>文生视频技术，智能生成商品动态视频等多种类型的营销视频；</li>
                    <li className="flex items-start gap-2 text-white/90 text-sm leading-relaxed"><span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm"></span>数字人直播带货，结合 AIGC 技术，可以实现更具个性化和趣味性的直播形式；</li>
                    <li className="flex items-start gap-2 text-white/90 text-sm leading-relaxed"><span className="mt-1.5 block w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-sm"></span>小红书、微博、抖音等平台营销，一键式发布。</li>
                  </ul>
                </Card.Content>
                <Card.Footer className="px-8 pb-8 pt-0 text-xs text-white/70 font-medium">
                  AIGC
                </Card.Footer>
              </Card>

              {/* 卡片 3：用户手册 (白色，右倾) */}
              <Card
                className="border-none shadow-[0_15px_30px_rgba(110,133,255,0.1)] bg-white transform lg:rotate-3 hover:rotate-0 hover:-translate-y-1 hover:scale-100 hover:shadow-[0_20px_40px_rgba(110,133,255,0.2)] transition-all duration-300 z-10 hover:z-30 w-[400px] h-[390px] flex flex-col ml-0 mt-4 rounded-3xl"
                style={{
                  background: 'linear-gradient(to top, #d2dbe8ff 0%, white 100%)'
                }}
              >
                <Card.Header className="pb-0 pt-3 px-8 flex justify-between items-start">
                  <h3 className="text-xl font-bold text-slate-900 tracking-wide -mt-4">用户手册
                    <span className="px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-600 font-medium shadow-sm border border-slate-200 ml-2 mt-24">使用指引</span>
                  </h3>
                </Card.Header>
                <Card.Content className="px-8 pt-4 pb-6 flex-grow">
                  <h4 className="text-base font-semibold text-slate-800 mb-3">使用说明</h4>
                  <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                    <p><strong className="text-slate-800">文案智造器：</strong>输入商品名字、特点等信息，会生成一系列宣传文案、广告词...</p>
                    <p><strong className="text-slate-800">营销图创作：</strong>根据输入的商品信息和图片，实现宣传图或产品描述图的智能生成...</p>
                    <p><strong className="text-slate-800">短视频智造：</strong>根据输入的商品图片，智能生成商品动态图、宣传片等多种类型的营销视频；</p>
                    <p><strong className="text-slate-800">数字直播大厅：</strong>结合 AIGC 技术，使用虚拟数字人，实现更具个性化和趣味性的直播形式。</p>
                  </div>
                </Card.Content>
                <Card.Footer className="px-8 pb-8 pt-0 text-xs text-slate-400 font-medium">
                  AIGC
                </Card.Footer>
              </Card>

            </div>


          </div>
        </div>
      </main>
    </div>
  );
}