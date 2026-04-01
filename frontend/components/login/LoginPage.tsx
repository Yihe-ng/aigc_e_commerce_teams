"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Sparkles, BarChart3, Share2, Video, User, Lock, ArrowRight } from "lucide-react"
import ParticlesBackground from "@/components/ui/particles-background"
import { ThemeToggle } from "@/components/theme/theme-toggle"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  
  // 3D 倾斜卡片状态
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardTransform, setCardTransform] = useState({ rotateX: 0, rotateY: 0 })
  const [isHovering, setIsHovering] = useState(false)
  
  // 鼠标移动处理
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setCardTransform({
      rotateX: -y * 15,
      rotateY: x * 15
    })
  }, [])
  
  // 鼠标离开处理
  const handleMouseLeave = useCallback(() => {
    setCardTransform({ rotateX: 0, rotateY: 0 })
    setIsHovering(false)
  }, [])
  
  // 鼠标进入处理
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && (data?.status === 'success')) {
        router.push("/home")
      } else {
        alert((data && data.message) ? data.message : `登录请求失败: ${response.status}`)
      }
    } catch (error) {
      console.error('登录失败:', error)
      alert('登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-sky-50 via-white to-indigo-50 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">

      <div className="fixed right-4 top-4 z-[100] md:right-6 md:top-6">
        <ThemeToggle />
      </div>

      {/* 粒子背景 */}
      <ParticlesBackground />

      <div className="relative z-10 w-full max-w-[1060px] grid md:auto-cols-max md:grid-flow-col gap-0 md:justify-center items-center px-4">
        {/* 左侧：项目介绍（毛玻璃3D倾斜卡片） */}
        <div className="hidden md:block w-full max-w-[360px] md:translate-y-16" style={{ perspective: '1000px' }}>
          <div 
            ref={cardRef}
            className="relative rounded-[20px] duration-300 ease-out will-change-transform"
            style={{
              transform: `rotateX(${cardTransform.rotateX}deg) rotateY(${cardTransform.rotateY}deg)`,
              transformStyle: 'preserve-3d',
              transitionProperty: 'transform'
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
            <div className="relative rounded-[20px] border border-white/70 bg-white/25 backdrop-blur-2xl shadow-[0_25px_80px_-20px_rgba(59,130,246,0.25),0_0_0_1px_rgba(255,255,255,0.4)_inset,0_0_30px_rgba(147,197,253,0.2)] px-8 py-8 min-h-[510px] flex flex-col justify-center overflow-hidden dark:border-slate-600/50 dark:bg-slate-900/40 dark:shadow-[0_25px_80px_-20px_rgba(0,0,0,0.5),0_0_0_1px_rgba(148,163,184,0.15)_inset]">
              
              {/* 顶部高光 */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-white to-transparent"></div>
              <div className="pointer-events-none absolute inset-x-8 top-1 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
              
              {/* 内部光晕效果 */}
              <div className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full blur-3xl"></div>
              <div className="pointer-events-none absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-cyan-200/15 to-transparent rounded-full blur-3xl"></div>
              
              {/* 边框发光效果 */}
              <div className="pointer-events-none absolute inset-0 rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.3)]"></div>
              
              {/* 内容层 */}
              <div className="relative z-10" style={{ transform: 'translateZ(20px)' }}>
                <div className="mb-4 text-slate-800 text-2xl font-bold tracking-[-0.02em] dark:text-slate-100">项目介绍</div>
                <div className="text-slate-700 font-medium leading-7 text-[15px] dark:text-slate-300">
                  智创电商营销系统，集成内容生产、投放分发、数据看板与智能分析，助力商家实现全链路增长。
                </div>
                <div className="mt-8 grid grid-cols-2 gap-3 text-[13px]">
                  <div className="group flex items-center gap-3 rounded-2xl p-4 bg-white/50 backdrop-blur-md border-2 border-white/80 shadow-sm text-slate-700 font-medium transition-all duration-300 hover:bg-white/70 hover:scale-[1.02] hover:shadow-md hover:border-white dark:border-slate-600/60 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800/80" style={{ transform: 'translateZ(30px)' }}>
                    <Sparkles className="w-5 h-5 text-blue-600/90 dark:text-sky-400" />
                    <span>AI文案/图片生成</span>
                  </div>
                  <div className="group flex items-center gap-3 rounded-2xl p-4 bg-white/50 backdrop-blur-md border-2 border-white/80 shadow-sm text-slate-700 font-medium transition-all duration-300 hover:bg-white/70 hover:scale-[1.02] hover:shadow-md hover:border-white dark:border-slate-600/60 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800/80" style={{ transform: 'translateZ(30px)' }}>
                    <BarChart3 className="w-5 h-5 text-indigo-600/90 dark:text-indigo-400" />
                    <span>商品看板与洞察</span>
                  </div>
                  <div className="group flex items-center gap-3 rounded-2xl p-4 bg-white/50 backdrop-blur-md border-2 border-white/80 shadow-sm text-slate-700 font-medium transition-all duration-300 hover:bg-white/70 hover:scale-[1.02] hover:shadow-md hover:border-white dark:border-slate-600/60 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800/80" style={{ transform: 'translateZ(30px)' }}>
                    <Share2 className="w-5 h-5 text-cyan-600/90 dark:text-cyan-400" />
                    <span>多渠道投放管理</span>
                  </div>
                  <div className="group flex items-center gap-3 rounded-2xl p-4 bg-white/50 backdrop-blur-md border-2 border-white/80 shadow-sm text-slate-700 font-medium transition-all duration-300 hover:bg-white/70 hover:scale-[1.02] hover:shadow-md hover:border-white dark:border-slate-600/60 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800/80" style={{ transform: 'translateZ(30px)' }}>
                    <Video className="w-5 h-5 text-violet-600/90 dark:text-violet-400" />
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
            <div className="relative h-full w-full bg-white rounded-[22px] shadow-[0_25px_80px_-20px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.8)_inset] z-10 transition-colors dark:bg-slate-900 dark:shadow-[0_25px_80px_-20px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]">
              
              {/* 顶部装饰线 */}
              <div className="h-1 w-full bg-blue-400 rounded-t-[20px] dark:bg-violet-500"></div>
              
              <CardHeader className="space-y-3 px-10 pt-10 pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-center text-slate-800 whitespace-nowrap leading-tight dark:text-slate-100">
                  智创电商营销系统
                </h1>
                {/* 装饰性下划线 */}
                <div className="flex justify-center">
                  <div className="w-16 h-[3px] bg-blue-400 rounded-full"></div>
                </div>
                <CardDescription className="text-center text-slate-500 text-sm tracking-wide pt-1 dark:text-slate-400">
                  请输入您的账号和密码登录系统
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 max-w-md mx-auto mt-8 px-10">
                  {/* 账号输入框 - 轻拟态内凹风格 */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm font-medium dark:text-slate-300" htmlFor="username">账号</Label>
                    <div className="relative group/input">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                        <User className="h-5 w-5 text-slate-400 group-focus-within/input:text-blue-600 transition-colors duration-200" />
                      </div>
                      <Input
                        id="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-14 rounded-2xl border-0 outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-0 pl-12 pr-5 font-medium text-slate-700 placeholder:text-slate-400 bg-[#EFF4F9] shadow-[inset_2px_2px_3px_rgba(71,85,105,0.12),inset_6px_6px_12px_rgba(71,85,105,0.04),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] transition-all duration-400 ease-out focus:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus-visible:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus:text-blue-600 focus-visible:text-blue-600 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:shadow-[inset_2px_2px_8px_rgba(0,0,0,0.35),0_0_0_1000px_rgb(30_41_59_/_0.95)_inset] dark:focus:text-sky-300 dark:focus-visible:text-sky-300"
                        placeholder="请输入账号"
                        style={{ WebkitTextFillColor: "#334155" }}
                      />
                    </div>
                  </div>
                  
                  {/* 密码输入框 - 轻拟态内凹风格 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-700 text-sm font-medium dark:text-slate-300" htmlFor="password">密码</Label>
                      <a href="#" className="text-sm text-blue-500 hover:text-blue-600 hover:underline">
                        忘记密码?
                      </a>
                    </div>
                    <div className="relative group/input">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within/input:text-blue-600 transition-colors duration-200" />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-14 rounded-2xl border-0 outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-0 pl-12 pr-12 font-medium text-slate-700 placeholder:text-slate-400 bg-[#EFF4F9] shadow-[inset_2px_2px_3px_rgba(71,85,105,0.12),inset_6px_6px_12px_rgba(71,85,105,0.04),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] transition-all duration-400 ease-out focus:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus-visible:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus:text-blue-600 focus-visible:text-blue-600 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:shadow-[inset_2px_2px_8px_rgba(0,0,0,0.35),0_0_0_1000px_rgb(30_41_59_/_0.95)_inset] dark:focus:text-sky-300 dark:focus-visible:text-sky-300"
                        placeholder="请输入密码"
                        style={{ WebkitTextFillColor: "#334155" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  
                  {/* 记住我 */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-slate-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                    <Label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">
                      记住我
                    </Label>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 px-10 pb-10">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        登录中...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        登录
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </Button>
                  
                  {/* 注册链接 */}
                  <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                    还没有账号？
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        router.push("/register")
                      }}
                      className="text-blue-500 hover:text-blue-600 font-medium ml-1 hover:underline"
                    >
                      立即注册
                    </a>
                  </div>
                </CardFooter>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
