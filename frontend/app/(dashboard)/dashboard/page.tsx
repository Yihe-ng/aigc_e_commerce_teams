import { useId } from "react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Activity,
  Download,
  Target,
  ArrowUpRight,
  Radio,
  Zap,
} from "lucide-react";

import {
  sparkData,
  kpis,
  trafficSources,
  productLeaders,
  actionPlan,
} from "@/lib/mock-data";

function Sparkline({ data }: { data: number[] }) {
  const chartId = useId();
  const gradientId = `gradient-${chartId}`;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1 || 1)) * 100;
      const y = 100 - ((value - min) / (max - min || 1)) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="h-16 w-full">
      <polyline
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        strokeLinecap="round"
        points={points}
      />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              实时刷新 · 最后更新 5 分钟前
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-default-900">
              用户数据看板
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              导出报表
            </Button>
            <Button variant="outline" className="gap-2">
              <Zap className="h-4 w-4" />
              一键优化
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Card
              key={kpi.title}
              className="border-0 bg-slate-900 text-white shadow-lg"
            >
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center justify-between text-sm text-default-200">
                  <span className="font-medium">{kpi.title}</span>
                  <kpi.icon className="h-4 w-4 text-default-300" />
                </div>
                <div className="text-2xl font-semibold">{kpi.value}</div>
                <div className="flex items-center justify-between text-sm text-default-200">
                  <span>{kpi.change}</span>
                  <Sparkline data={kpi.trend} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">
                  营收趋势 · 最近 12 周
                </CardTitle>
                <p className="text-sm text-blue-100">
                  结合 GMV、访客与转化率综合指数
                </p>
              </div>
              <Button variant="light" className="text-white">
                查看明细
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64 rounded-2xl bg-white/10 p-6 backdrop-blur">
                <Sparkline data={sparkData} />
                <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-blue-100">转化率</p>
                    <p className="text-lg font-semibold">3.82%</p>
                  </div>
                  <div>
                    <p className="text-blue-100">客单价</p>
                    <p className="text-lg font-semibold">¥429</p>
                  </div>
                  <div>
                    <p className="text-blue-100">复购贡献</p>
                    <p className="text-lg font-semibold">34%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>流量来源结构</CardTitle>
              <p className="text-sm text-slate-500">
                实时刷新 · 按成交贡献排序
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {trafficSources.map((source) => (
                <div key={source.name}>
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                    <span>{source.name}</span>
                    <span className="text-blue-500">{source.growth}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
                      style={{ width: `${source.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>热销商品排行</CardTitle>
                <p className="text-sm text-default-500">按近 7 天销售额排序</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-default-600"
              >
                明细 <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {productLeaders.map((product) => (
                <div
                  key={product.name}
                  className="rounded-2xl border border-divider p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-base font-semibold text-default-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {product.category}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-emerald-500">
                      {product.growth}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-slate-600">
                    销售额 {product.sales}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>重点行动计划</CardTitle>
              <p className="text-sm text-slate-500">
                同步 GUI 运营看板的任务结构
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {actionPlan.map((task) => (
                <div
                  key={task.title}
                  className="rounded-2xl border border-divider p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-default-900">
                        {task.title}
                      </p>
                      <p className="text-sm text-slate-500">{task.desc}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                      {task.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <Target className="h-4 w-4" />
                    负责人：{task.owner}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>实时运营基建</CardTitle>
              <p className="text-sm text-slate-500">
                已将 GUI 模板中的“营销电台 +
                数据网格”拆成组件，可继续接入实时数据
              </p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-slate-600">
              了解详情 <Radio className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-5 text-white">
              <p className="text-sm text-blue-200">AIGC 直播助理</p>
              <p className="mt-2 text-2xl font-semibold">正在推送直播脚本</p>
              <p className="mt-4 text-sm text-blue-100">
                预计 15 分钟后完成推送
              </p>
            </div>
            <div className="rounded-2xl border border-divider p-5">
              <p className="text-sm text-slate-500">AI 文案生成</p>
              <p className="mt-2 text-2xl font-semibold text-default-900">
                24 条草稿
              </p>
              <p className="mt-4 text-sm text-slate-500">
                待审核 · 可直接跳转到 /test/1 继续编辑
              </p>
            </div>
            <div className="rounded-2xl border border-divider p-5">
              <p className="text-sm text-slate-500">营销笔记发布</p>
              <p className="mt-2 text-2xl font-semibold text-default-900">
                6 篇排队
              </p>
              <p className="mt-4 text-sm text-slate-500">
                同步 GUI note.html 内容结构
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
