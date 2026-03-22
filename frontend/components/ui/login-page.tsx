"use client";

import type React from "react";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  EyeOff,
  Sparkles,
  BarChart3,
  Share2,
  Video,
  User,
  Lock,
  ArrowRight,
} from "lucide-react";
import ParticlesBackground from "./particles-background";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // 3D 倾斜卡片状态
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardTransform, setCardTransform] = useState({
    rotateX: 0,
    rotateY: 0,
  });
  const [isHovering, setIsHovering] = useState(false);

  // 鼠标移动处理
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCardTransform({
      rotateX: -y * 15,
      rotateY: x * 15,
    });
  }, []);

  // 鼠标离开处理
  const handleMouseLeave = useCallback(() => {
    setCardTransform({ rotateX: 0, rotateY: 0 });
    setIsHovering(false);
  }, []);

  // 鼠标进入处理
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.status === "success") {
        const targetHost = window.location.hostname;
        window.location.href = `http://${targetHost}:3000/dashboard`;
      } else {
        alert(
          data && data.message
            ? data.message
            : `登录请求失败: ${response.status}`,
        );
      }
    } catch (error) {
      console.error("登录失败:", error);
      alert("登录失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // ...处理逻辑
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* 粒子背景 */}
      <ParticlesBackground />

      {/* 登录卡片 - 使用深蓝底色（已停用，保留备选） */}
      <div className="hidden">
        <Card
          className={
            "bg-slate-800/90 border border-blue-600/30 shadow-2xl shadow-slate-900/90 rounded-[12px] min-h-[500px] grid md:grid-cols-5 overflow-hidden"
          }
        >
          {/* ================= 左侧：抽象科技概念展示 ================= */}
          <div
            className={
              "bg-slate-900 hidden md:flex md:col-span-3 flex-col justify-center items-center relative overflow-hidden p-10"
            }
          >
            {/* 背景：深邃的极光渐变 */}
            <div className="absolute inset-0 z-0">
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900 animate-[spin_60s_linear_infinite]"></div>
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-transparent via-slate-900/80 to-slate-900"></div>
            </div>

            {/* 核心视觉：3D 悬浮引擎结构 */}
            <div className="relative z-10 w-56 h-56 mb-10 flex items-center justify-center">
              {/* 外圈轨道 1 */}
              <div className="absolute w-full h-full border border-blue-500/20 rounded-full animate-[spin_10s_linear_infinite]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_#3b82f6]"></div>
              </div>

              {/* 外圈轨道 2 (反向旋转) */}
              <div className="absolute w-48 h-48 border border-indigo-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse]">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1.5 w-2 h-2 bg-indigo-400 rounded-full"></div>
              </div>

              {/* 中心核心：发光球体 */}
              <div className="relative w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full shadow-[0_0_50px_rgba(37,99,235,0.5)] flex items-center justify-center animate-pulse">
                {/* 中心 LOGO */}
                <svg
                  className="w-16 h-16 text-white drop-shadow-md"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>

              {/* 悬浮的功能图标 */}
              {/* 1. 购物车 (电商) */}
              <div
                className="absolute -top-4 -right-4 bg-slate-800/80 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-lg animate-bounce"
                style={{ animationDelay: "0s" }}
              >
                <span className="text-xl">🛒</span>
              </div>
              {/* 2. 喇叭 (营销) */}
              <div
                className="absolute bottom-4 -left-8 bg-slate-800/80 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-lg animate-bounce"
                style={{ animationDelay: "1s" }}
              >
                <span className="text-xl">📢</span>
              </div>
              {/* 3. 搜索 (流量) */}
              <div
                className="absolute top-1/2 -right-12 bg-slate-800/80 backdrop-blur-md p-2.5 rounded-xl border border-white/10 shadow-lg animate-bounce"
                style={{ animationDelay: "2s" }}
              >
                <span className="text-xl">🔍</span>
              </div>
            </div>

            {/* 文案区域 */}
            <div className="relative z-10 text-center space-y-4 max-w-sm">
              <h2 className="text-4xl font-bold text-white tracking-[-0.02em]">
                智能营销，从这里开始
              </h2>
              <div className="w-12 h-1 bg-blue-500 mx-auto rounded-full"></div>
              <p className="text-slate-400 text-sm leading-relaxed tracking-[-0.005em]">
                AI驱动营销革新，智能生成文案、图片、视频，数字人直播带货，助力品牌实现电商数字化转型升级。
              </p>
            </div>

            {/* 底部装饰：网格线 */}
            <div className="absolute bottom-0 w-full h-24 bg-[linear-gradient(to_top,rgba(15,23,42,1),transparent)] z-10"></div>
            <div
              className="absolute bottom-0 w-full h-full opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #3b82f6 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            ></div>
          </div>
          <div className="md:col-span-2">
            <CardHeader className="space-y-1 px-10 pt-10">
              {/* 系统名称使用亮蓝色 */}
              <h1 className="text-4xl font-bold tracking-[-0.02em] text-center text-blue-400 mb-2 mt-14">
                智创电商营销系统
              </h1>
              {/* 标题使用白色 */}
              <CardDescription className="text-center text-blue-100 tracking-[-0.005em]">
                请输入您的账号和密码登录系统
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 max-w-md ml-auto mt-6 mr-1 px-10">
                <div className="space-y-2">
                  <Label className="text-blue-100" htmlFor="username">
                    账号
                  </Label>
                  <div className="relative p-[1.5px] rounded-[12px] bg-gradient-to-r from-blue-500/30 to-slate-400/30 transition-shadow focus-within:shadow-[0_8px_24px_rgba(37,99,235,0.15)]">
                    <div className="relative rounded-[11px] bg-white/60 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.55),_0_1px_1px_rgba(0,0,0,0.04)]">
                      <Input
                        id="username"
                        className="h-10 rounded-[11px] px-4 border-0 bg-transparent text-slate-900 placeholder:text-slate-500 focus-visible:ring-0"
                        type="text"
                        placeholder="请输入账号"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-blue-100" htmlFor="password">
                      密码
                    </Label>
                    <a
                      href="#"
                      className="text-sm text-blue-300 hover:text-blue-400 hover:underline"
                    >
                      忘记密码?
                    </a>
                  </div>
                  <div className="relative p-[1.5px] rounded-[12px] bg-gradient-to-r from-blue-500/30 to-slate-400/30 transition-shadow focus-within:shadow-[0_8px_24px_rgba(37,99,235,0.15)]">
                    <div className="relative rounded-[11px] bg-white/60 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.55),_0_1px_1px_rgba(0,0,0,0.04)]">
                      <Input
                        id="password"
                        className="h-10 rounded-[11px] px-4 pr-10 border-0 bg-transparent text-slate-900 placeholder:text-slate-500 focus-visible:ring-0"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "隐藏密码" : "显示密码"}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-blue-400 hover:text-blue-500"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-dark"
                    checked={rememberMe}
                    onCheckedChange={(checked) => {
                      if (typeof checked === "boolean") {
                        setRememberMe(checked);
                      }
                    }}
                    className="border-blue-400 data-[state=checked]:bg-blue-500 cursor-pointer"
                  />
                  <Label
                    htmlFor="remember-dark"
                    className="text-sm font-normal text-blue-100 cursor-pointer"
                  >
                    记住我
                  </Label>
                </div>
              </CardContent>
              <CardFooter className="max-w-md mr-1 px-10 pb-10">
                {/* 按钮使用蓝色渐变 */}
                <Button
                  type="submit"
                  className="h-11 w-full rounded-[12px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold shadow-lg transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? "登录中..." : "登录"}
                </Button>
              </CardFooter>
            </form>
            <div className="px-8 pb-6 text-right text-sm text-blue-200 mr-[104px]">
              还没有账号?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/register");
                }}
                className="text-blue-300 hover:text-blue-400 hover:underline"
              >
                注册
              </a>
            </div>
          </div>
        </Card>
      </div>

      <div className="relative z-10 w-full max-w-[1060px] grid md:auto-cols-max md:grid-flow-col gap-0 md:justify-center items-center px-4">
        {/* 左侧：项目介绍（毛玻璃3D倾斜卡片） */}
        <div
          className="hidden md:block w-full max-w-[360px] md:translate-y-16"
          style={{ perspective: "1000px" }}
        >
          <div
            ref={cardRef}
            className="relative rounded-[20px] duration-300 ease-out will-change-transform"
            style={{
              transform: `rotateX(${cardTransform.rotateX}deg) rotateY(${cardTransform.rotateY}deg)`,
              transformStyle: "preserve-3d",
              transitionProperty: "transform",
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
          >
            {/* 外层发光阴影 - 营造悬浮感 */}
            <div
              className="absolute -inset-3 rounded-[26px] bg-gradient-to-b from-blue-400/40 via-cyan-400/30 to-blue-500/40 blur-2xl transition-opacity duration-300"
              style={{ opacity: isHovering ? 0.9 : 0.5 }}
            ></div>
            <div className="absolute -inset-2 rounded-[24px] bg-gradient-to-br from-blue-300/20 to-indigo-400/20 blur-xl opacity-60"></div>

            {/* 主体毛玻璃卡片 */}
            <div className="relative rounded-[20px] border border-white/70 bg-white/25 backdrop-blur-2xl shadow-[0_25px_80px_-20px_rgba(59,130,246,0.25),0_0_0_1px_rgba(255,255,255,0.4)_inset,0_0_30px_rgba(147,197,253,0.2)] px-8 py-8 min-h-[510px] flex flex-col justify-center overflow-hidden">
              {/* 顶部高光 */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-white to-transparent"></div>
              <div className="pointer-events-none absolute inset-x-8 top-1 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>

              {/* 内部光晕效果 */}
              <div className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-3xl"></div>
              <div className="pointer-events-none absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-cyan-200/15 to-transparent rounded-full blur-3xl"></div>

              {/* 边框发光效果 */}
              <div className="pointer-events-none absolute inset-0 rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.3)]"></div>

              {/* 内容层 */}
              <div
                className="relative z-10"
                style={{ transform: "translateZ(20px)" }}
              >
                <div className="mb-4 text-slate-800 text-2xl font-bold tracking-[-0.02em]">
                  项目介绍
                </div>
                <div className="text-slate-700 font-medium leading-7 text-[15px]">
                  智创电商营销系统，集成内容生产、投放分发、数据看板与智能分析，助力商家实现全链路增长。
                </div>
                <div className="mt-8 grid grid-cols-2 gap-3 text-[13px]">
                  <div
                    className="group flex items-center gap-3 rounded-2xl p-4 bg-white/50 backdrop-blur-md border-2 border-white/80 shadow-sm text-slate-700 font-medium transition-all duration-300 hover:bg-white/70 hover:scale-[1.02] hover:shadow-md hover:border-white"
                    style={{ transform: "translateZ(30px)" }}
                  >
                    <Sparkles className="w-5 h-5 text-blue-600/90" />
                    <span>AI文案/图片生成</span>
                  </div>
                  <div
                    className="group flex items-center gap-3 rounded-2xl p-4 bg-white/50 backdrop-blur-md border-2 border-white/80 shadow-sm text-slate-700 font-medium transition-all duration-300 hover:bg-white/70 hover:scale-[1.02] hover:shadow-md hover:border-white"
                    style={{ transform: "translateZ(30px)" }}
                  >
                    <BarChart3 className="w-5 h-5 text-indigo-600/90" />
                    <span>商品看板与洞察</span>
                  </div>
                  <div
                    className="group flex items-center gap-3 rounded-2xl p-4 bg-white/50 backdrop-blur-md border-2 border-white/80 shadow-sm text-slate-700 font-medium transition-all duration-300 hover:bg-white/70 hover:scale-[1.02] hover:shadow-md hover:border-white"
                    style={{ transform: "translateZ(30px)" }}
                  >
                    <Share2 className="w-5 h-5 text-cyan-600/90" />
                    <span>多渠道投放管理</span>
                  </div>
                  <div
                    className="group flex items-center gap-3 rounded-2xl p-4 bg-white/50 backdrop-blur-md border-2 border-white/80 shadow-sm text-slate-700 font-medium transition-all duration-300 hover:bg-white/70 hover:scale-[1.02] hover:shadow-md hover:border-white"
                    style={{ transform: "translateZ(30px)" }}
                  >
                    <Video className="w-5 h-5 text-violet-600/90" />
                    <span>数字人直播互动</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧登录卡片（精致流光边框效果） */}
        <div className="w-full max-w-[650px] md:-ml-4 md:-translate-y-8">
          {/* ========== Layer 1: 容器 - 负责悬浮动画和裁剪，p-[2px] 精确控制边框宽度 ========== */}
          <div className="relative w-full h-auto rounded-[24px] overflow-hidden z-0 p-[2px] animate-float group">
            {/* ========== Layer 2: 光束层 - 柔和彗星拖尾效果 ========== */}
            <div className="absolute inset-[-100%] w-[300%] h-[300%] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#0000_50%,#bfdbfe_70%,#3b82f6_100%)] opacity-60 blur-md animate-spin-soft"></div>

            {/* ========== Layer 3: 内容遮罩层 - 纯白背景完全遮挡中间 ========== */}
            <div className="relative h-full w-full bg-white rounded-[22px] shadow-[0_25px_80px_-20px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.8)_inset] z-10">
              {/* 顶部装饰线 */}
              <div className="h-1 w-full bg-blue-400 rounded-t-[20px]"></div>

              <CardHeader className="space-y-3 px-10 pt-10 pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-center text-slate-800 whitespace-nowrap leading-tight">
                  智创电商营销系统
                </h1>
                {/* 装饰性下划线 */}
                <div className="flex justify-center">
                  <div className="w-16 h-[3px] bg-blue-400 rounded-full"></div>
                </div>
                <CardDescription className="text-center text-slate-500 text-sm tracking-wide pt-1">
                  请输入您的账号和密码登录系统
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 max-w-md mx-auto mt-8 px-10">
                  {/* 账号输入框 - 轻拟态内凹风格 */}
                  <div className="space-y-2">
                    <Label
                      className="text-slate-700 text-sm font-medium"
                      htmlFor="username"
                    >
                      账号
                    </Label>
                    <div className="relative group/input">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                        <User className="h-5 w-5 text-slate-400 group-focus-within/input:text-blue-600 transition-colors duration-200" />
                      </div>
                      <Input
                        id="username"
                        className="w-full h-14 rounded-2xl border-0 outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-0 pl-12 pr-5 font-medium text-slate-700 placeholder:text-slate-400 bg-[#EFF4F9] shadow-[inset_2px_2px_3px_rgba(71,85,105,0.12),inset_6px_6px_12px_rgba(71,85,105,0.04),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] transition-all duration-400 ease-out focus:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus-visible:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus:text-blue-600 focus-visible:text-blue-600"
                        type="text"
                        placeholder="请输入账号"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ WebkitTextFillColor: "#334155" }}
                      />
                    </div>
                  </div>

                  {/* 密码输入框 - 轻拟态内凹风格 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        className="text-slate-700 text-sm font-medium"
                        htmlFor="password"
                      >
                        密码
                      </Label>
                      <a
                        href="#"
                        className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors duration-200"
                      >
                        忘记密码?
                      </a>
                    </div>
                    <div className="relative group/input">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within/input:text-blue-600 transition-colors duration-200" />
                      </div>
                      <Input
                        id="password"
                        className="w-full h-14 rounded-2xl border-0 outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-0 pl-12 pr-12 font-medium text-slate-700 placeholder:text-slate-400 bg-[#EFF4F9] shadow-[inset_2px_2px_3px_rgba(71,85,105,0.12),inset_6px_6px_12px_rgba(71,85,105,0.04),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] transition-all duration-400 ease-out focus:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus-visible:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus:text-blue-600 focus-visible:text-blue-600"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ WebkitTextFillColor: "#334155" }}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "隐藏密码" : "显示密码"}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 group-focus-within/input:text-blue-600 hover:text-slate-600 transition-colors duration-200 z-10"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 记住我 */}
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => {
                        if (typeof checked === "boolean") {
                          setRememberMe(checked);
                        }
                      }}
                      className="border-2 border-slate-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 h-5 w-5 cursor-pointer"
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm font-medium text-slate-600 cursor-pointer select-none"
                    >
                      记住我
                    </Label>
                  </div>
                </CardContent>

                <CardFooter className="max-w-md mx-auto px-10 pb-6">
                  <Button
                    type="submit"
                    className="h-14 w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold text-base shadow-[0_4px_20px_rgba(59,130,246,0.5),0_0_0_1px_rgba(255,255,255,0.3)_inset] hover:shadow-[0_6px_30px_rgba(59,130,246,0.6),0_0_0_1px_rgba(255,255,255,0.4)_inset] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        登录中...
                      </span>
                    ) : (
                      "登录"
                    )}
                  </Button>
                </CardFooter>
              </form>

              {/* 分隔线 */}
              <div className="px-10 py-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-white text-slate-400">或</span>
                  </div>
                </div>
              </div>

              {/* 注册链接 */}
              <div className="px-8 pb-8 text-center">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push("/register");
                  }}
                  className="group/link inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-500 font-medium transition-all duration-200"
                >
                  还没有账号?
                  <span className="text-blue-500 group-hover/link:text-blue-600 inline-flex items-center gap-1">
                    立即注册
                    <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform duration-200" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        /* ========== 精致流光边框动画 ========== */

        /* 悬浮动画 - 上下漂浮效果 */
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        /* 光束旋转动画 - 12秒一圈，柔和自然 */
        @keyframes spin-soft {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* 应用悬浮动画 */
        .animate-float {
          will-change: transform;
          animation: float 6s ease-in-out infinite;
        }

        /* 应用柔和旋转动画 */
        .animate-spin-soft {
          will-change: transform;
          animation: spin-soft 12s linear infinite;
        }

        /* hover 时暂停所有动画 - 容器自身和子元素 */
        .animate-float:hover,
        .animate-float:focus-within,
        .group:hover .animate-float,
        .group:hover .animate-spin-soft,
        .group:focus-within .animate-float,
        .group:focus-within .animate-spin-soft {
          animation-play-state: paused !important;
        }

        /* ========== 修复浏览器自动填充样式 ========== */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #334155 !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        /* 强制移除所有输入框的默认 outline */
        input:focus,
        input:focus-visible,
        input:-webkit-autofill:focus {
          outline: none !important;
          outline-offset: 0 !important;
        }

        /* 兼容旧版 neon 效果（保留备用） */
        @keyframes neon-breathe {
          0% {
            opacity: 0.55;
            filter: blur(6px) saturate(1.1);
          }
          100% {
            opacity: 0.8;
            filter: blur(10px) saturate(1.25);
          }
        }

        .neon-ring {
          background: conic-gradient(
            from 0deg,
            rgba(34, 211, 238, 0) 0deg,
            rgba(34, 211, 238, 0.35) 40deg,
            rgba(59, 130, 246, 0.9) 90deg,
            rgba(147, 197, 253, 1) 120deg,
            rgba(59, 130, 246, 0.9) 170deg,
            rgba(34, 211, 238, 0.35) 220deg,
            rgba(34, 211, 238, 0) 360deg
          );
          filter: blur(8px) saturate(1.2);
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          padding: 2px;
        }

        .neon-soft {
          box-shadow:
            0 0 40px rgba(59, 130, 246, 0.25),
            0 0 80px rgba(34, 211, 238, 0.15),
            0 0 120px rgba(96, 165, 250, 0.08);
          background: radial-gradient(
            120% 120% at 50% 50%,
            rgba(59, 130, 246, 0.18),
            transparent 60%
          );
          filter: blur(6px);
          animation: neon-breathe 3.8s ease-in-out alternate infinite;
        }
      `}</style>
    </div>
  );
}
