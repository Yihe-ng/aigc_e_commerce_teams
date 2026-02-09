"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Canvas from "./canvas"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 简单本地验证
      if(email === 'zxhy' && password === '12345678') {
        // 调用Flask后端API
        const response = await fetch('http://localhost:5050/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        if(response.ok) {
          // 登录成功后跳转到主页
          window.location.href = 'http://localhost:5000/home'
        }
      } else {
        alert('账号或密码错误')
      }
    } catch (error) {
      console.error('登录失败:', error)
      alert('登录失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // ...处理逻辑
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center">
      {/* 背景调整为深海蓝渐变 */}
      <div className="absolute inset-0 z-0">
        <Canvas style={{ 
          background: 'linear-gradient(135deg,rgb(137, 188, 255) 0%,rgb(0, 61, 147) 100%)'
        }} />
      </div>

      {/* 登录卡片 - 使用深蓝底色 */}
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="bg-slate-800/90 backdrop-blur-sm border border-blue-600/30 shadow-xl shadow-blue-500/10">
          <CardHeader className="space-y-1">
            {/* 系统名称使用亮蓝色 */}
            <h1 className="text-3xl font-bold text-center text-blue-400 mb-2">智创电商营销系统</h1>
            {/* 标题使用白色 */}
            <CardDescription className="text-center text-blue-100">输入您的账号和密码登录系统</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-blue-100" htmlFor="username">账号</Label>
                <Input
                  id="username"
                  className="bg-slate-700 border-blue-500/50 text-white focus:ring-blue-400 focus:border-blue-400"
                  type="text"
                  placeholder="请输入账号"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-blue-100" htmlFor="password">密码</Label>
                  <a href="#" className="text-sm text-blue-300 hover:text-blue-400 hover:underline">
                    忘记密码?
                  </a>
                </div>
                <Input
                  id="password"
                  className="bg-slate-700 border-blue-500/50 text-white focus:ring-blue-400 focus:border-blue-400"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  className="border-blue-400 data-[state=checked]:bg-blue-500"
                />
                <Label htmlFor="remember" className="text-sm font-normal text-blue-100">
                  记住我
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              {/* 按钮使用蓝色渐变 */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-medium shadow-md transition-all"
                disabled={isLoading}
              >
                {isLoading ? "登录中..." : "登录"}
              </Button>
            </CardFooter>
          </form>
          <div className="px-8 pb-6 text-center text-sm text-blue-200">
            还没有账号?{" "}
            <a href="#" className="text-blue-300 hover:text-blue-400 hover:underline">
              注册
            </a>
          </div>
        </Card>
      </div>
    </div>
  )
}

