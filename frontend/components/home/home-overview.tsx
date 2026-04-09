"use client"

import { Card } from "@heroui/react"

export function HomeOverview() {
  const features = [
    "知识库 + 大语言模型",
    "文生图片技术",
    "文生视频技术",
    "数字人直播带货",
    "多平台一键营销分发",
  ]

  return (
    <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[#F1F3FA] px-6 py-8 sm:px-8 lg:px-10 lg:py-10 dark:bg-slate-950">
      <div className="pointer-events-none absolute left-0 top-[56%] h-36 w-full -translate-y-1/2 overflow-hidden opacity-80 dark:opacity-40">
        <svg
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
          className="h-full w-full text-[#dbeafe] dark:text-slate-700"
        >
          <path d="M0,100 Q250,50 500,100 T1000,100" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
          <path d="M0,110 Q250,160 500,110 T1000,110" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        </svg>
      </div>
      <div className="pointer-events-none absolute left-0 top-[66%] h-36 w-full -translate-y-1/2 overflow-hidden opacity-80 dark:opacity-40">
        <svg
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
          className="h-full w-full text-[#dbeafe] dark:text-slate-700"
        >
          <path d="M0,100 Q250,50 500,100 T1000,100" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8" />
          <path d="M0,110 Q250,160 500,110 T1000,110" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        </svg>
      </div>

      <div className="relative z-10 space-y-8">
        <section className="rounded-[28px] bg-[#D9EAFD] px-6 py-10 sm:px-8 lg:px-10 dark:bg-slate-900/90 dark:ring-1 dark:ring-white/10">
          <h1 className="text-3xl font-semibold tracking-tight text-[#1e4c99] sm:text-4xl dark:text-sky-200">
            智创电商营销系统
          </h1>
          <p className="mt-3 max-w-4xl text-xl leading-relaxed text-[#4e4e4e] sm:text-2xl dark:text-slate-300">
            基于 AIGC 的新电商数字化营销技术研究与创新应用
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {features.map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-[rgb(194,224,255)]/80 px-4 py-2 text-sm text-slate-700 backdrop-blur-md dark:bg-slate-800/90 dark:text-slate-200"
              >
                {feature}
              </span>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 pt-2 lg:grid-cols-3 lg:items-stretch">
          <Card
            className="min-h-[320px] rounded-[28px] border-none bg-gradient-to-t from-[#d2dbe8] to-white shadow-[0_15px_30px_rgba(110,133,255,0.1)] motion-safe:transition-transform motion-safe:duration-300 dark:from-slate-800 dark:to-slate-900 dark:shadow-[0_15px_30px_rgba(0,0,0,0.35)] lg:-rotate-3 lg:hover:rotate-0"
          >
            <Card.Header className="px-8 pb-2 pt-7">
              <Card.Title className="text-xl font-bold tracking-wide text-slate-900 dark:text-slate-100">
                项目简介
              </Card.Title>
            </Card.Header>
            <Card.Content className="flex flex-1 flex-col px-8 pb-7 pt-2">
              <h2 className="mb-4 text-lg font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
                基于 AIGC 的新电商数字化营销技术研究与创新应用
              </h2>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                随着生成式人工智能技术的快速发展，电商产业正迎来新一轮的内容生产与营销变革。
                本项目利用 AI 技术加速电商行业自动化，实现商品文案、宣传图、营销视频与数字人直播内容的智能生成，
                以更低成本推动电商运营效率与创意产出升级。
              </p>
            </Card.Content>
          </Card>

          <Card
            className="min-h-[360px] rounded-[28px] border-none bg-[linear-gradient(105deg,#6bb9ff_0%,#6baeff_42%,#85b7ff_42%,#85c0ff_58%,#76b7ff_58%,#76c0ff_100%)] text-white shadow-[0_20px_50px_rgba(107,133,255,0.4)] motion-safe:transition-transform motion-safe:duration-300 dark:bg-[linear-gradient(105deg,#1e3a5f_0%,#1d4a7a_42%,#2563a8_42%,#1e40af_58%,#1d4d8c_58%,#172554_100%)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)] lg:scale-[1.03]"
          >
            <Card.Header className="px-8 pb-2 pt-7">
              <Card.Title className="text-xl font-bold tracking-wide text-white">功能概览</Card.Title>
            </Card.Header>
            <Card.Content className="px-8 pb-8 pt-2">
              <p className="mb-4 text-base font-semibold text-white/90">当前系统支持以下能力：</p>
              <ul className="space-y-3 text-sm leading-7 text-white/90">
                <li>大语言模型文案生成，解决传统电商行业中内容编写与编辑效率问题。</li>
                <li>文生图片技术，智能生成宣传图、商品描述图等视觉素材。</li>
                <li>文生视频技术，自动生成商品动态视频与营销短片。</li>
                <li>数字人直播带货，构建更具个性化与趣味性的直播体验。</li>
                <li>支持小红书、微博、抖音等平台的营销内容生产与分发。</li>
              </ul>
            </Card.Content>
          </Card>

          <Card
            className="min-h-[340px] rounded-[28px] border-none bg-gradient-to-t from-[#d2dbe8] to-white shadow-[0_15px_30px_rgba(110,133,255,0.1)] motion-safe:transition-transform motion-safe:duration-300 dark:from-slate-800 dark:to-slate-900 dark:shadow-[0_15px_30px_rgba(0,0,0,0.35)] lg:rotate-3 lg:hover:rotate-0"
          >
            <Card.Header className="px-8 pb-2 pt-7">
              <div className="flex items-center gap-2">
                <Card.Title className="text-xl font-bold tracking-wide text-slate-900 dark:text-slate-100">
                  用户手册
                </Card.Title>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  使用指引
                </span>
              </div>
            </Card.Header>
            <Card.Content className="space-y-3 px-8 pb-8 pt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              <p>
                <strong className="text-slate-800 dark:text-slate-100">文案智造器：</strong>
                输入商品名称、特点与受众信息，系统会生成一系列营销文案与广告词。
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-100">营销图创作：</strong>
                根据商品信息与图片快速生成宣传图或商品描述图。
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-100">短视频智造：</strong>
                基于商品图片自动生成营销视频与动态图内容。
              </p>
              <p>
                <strong className="text-slate-800 dark:text-slate-100">数字直播大厅：</strong>
                结合 AIGC 与虚拟数字人技术实现个性化直播营销。
              </p>
            </Card.Content>
          </Card>
        </section>
      </div>
    </div>
  )
}
