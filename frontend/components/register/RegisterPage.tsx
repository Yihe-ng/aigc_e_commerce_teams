"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, User, Lock } from "lucide-react"
import ParticlesBackground from "@/components/ui/particles-background"

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost"
  const logoUrl = `http://${host}:5000/static/images/${encodeURIComponent('zxhy-removebg-preview.png')}`

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      alert("请输入账号与密码")
      return
    }
    if (password !== confirm) {
      alert("两次输入的密码不一致")
      return
    }
    setIsSubmitting(true)
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("accounts") : null
      const list: Array<{ username: string; password: string }> = raw ? JSON.parse(raw) : []
      if (list.find((u) => u.username === username)) {
        alert("该账号已存在")
      } else {
        list.push({ username, password })
        localStorage.setItem("accounts", JSON.stringify(list))
        alert("注册成功，请使用该账号登录")
        router.push("/")
      }
    } catch {
      alert("注册失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <ParticlesBackground />
      <div className="absolute inset-0 flex items-center justify-center">
        <Card className="relative w-full max-w-[420px] bg-white/30 backdrop-blur-xl border border-white/40 shadow-[0_20px_50px_rgba(37,99,235,0.12)] rounded-[20px] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/25 to-transparent"></div>
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  'radial-gradient(100% 60% at 50% 0%, rgba(147,197,253,0.3) 0%, transparent 70%)',
              }}
            />
          </div>
          <CardHeader className="relative z-10 px-8 pt-10 pb-4">
            <div className="flex flex-col items-center">
              <img src={logoUrl} alt="智行合一" className="h-[100px] md:h-[120px] w-auto object-contain" />
              <CardTitle className="mt-1 text-xl font-bold text-slate-800 text-center">注册账号</CardTitle>
            </div>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="relative z-10 px-8 py-4 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 text-sm font-medium">账号</Label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                    <User className="h-5 w-5 text-slate-400 group-focus-within/input:text-blue-600 transition-colors duration-200" />
                  </div>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-14 rounded-2xl border-0 outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-0 pl-12 pr-5 font-medium text-slate-700 placeholder:text-slate-400 bg-[#EFF4F9] shadow-[inset_2px_2px_3px_rgba(71,85,105,0.12),inset_6px_6px_12px_rgba(71,85,105,0.04),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] transition-all duration-400 ease-out focus:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus-visible:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus:text-blue-600 focus-visible:text-blue-600"
                    placeholder="请输入账号"
                    style={{ WebkitTextFillColor: "#334155" }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 text-sm font-medium">密码</Label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within/input:text-blue-600 transition-colors duration-200" />
                  </div>
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 rounded-2xl border-0 outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-0 pl-12 pr-12 font-medium text-slate-700 placeholder:text-slate-400 bg-[#EFF4F9] shadow-[inset_2px_2px_3px_rgba(71,85,105,0.12),inset_6px_6px_12px_rgba(71,85,105,0.04),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] transition-all duration-400 ease-out focus:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus-visible:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus:text-blue-600 focus-visible:text-blue-600"
                    placeholder="请输入密码"
                    style={{ WebkitTextFillColor: "#334155" }}
                  />
                  <button
                    type="button"
                    aria-label={showPwd ? "隐藏密码" : "显示密码"}
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 group-focus-within/input:text-blue-600 hover:text-slate-600 transition-colors duration-200 z-10"
                  >
                    {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-slate-700 text-sm font-medium">确认密码</Label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within/input:text-blue-600 transition-colors duration-200" />
                  </div>
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full h-14 rounded-2xl border-0 outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-0 pl-12 pr-12 font-medium text-slate-700 placeholder:text-slate-400 bg-[#EFF4F9] shadow-[inset_2px_2px_3px_rgba(71,85,105,0.12),inset_6px_6px_12px_rgba(71,85,105,0.04),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] transition-all duration-400 ease-out focus:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus-visible:shadow-[inset_0px_0px_8px_rgba(59,130,246,0.3),inset_0px_0px_24px_rgba(59,130,246,0.12),inset_-3px_-3px_8px_rgba(255,255,255,1),0_0_0_1000px_#EFF4F9_inset] focus:text-blue-600 focus-visible:text-blue-600"
                    placeholder="请再次输入密码"
                    style={{ WebkitTextFillColor: "#334155" }}
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? "隐藏密码" : "显示密码"}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 group-focus-within/input:text-blue-600 hover:text-slate-600 transition-colors duration-200 z-10"
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="relative z-10 px-8 pb-6 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1E4FD8] hover:to-[#1E40AF] text-white font-semibold tracking-wide shadow-lg transition-all text-sm"
              >
                {isSubmitting ? "提交中..." : "注册"}
              </Button>
            </CardFooter>
          </form>
          <div className="px-8 pb-6 text-center text-xs text-slate-500">
            已有账号?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                router.push("/")
              }}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              返回登录
            </a>
          </div>
        </Card>
      </div>
    </main>
  )
}
