"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"
import loginBg from '../../../gui/static/images/bg2.jpg';

export default function ParticlesBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)

  useEffect(() => {
    // 避免重复初始化，同时检查 DOM 元素是否存在
    if (isInitialized.current || !window.particlesJS || !document.getElementById('particles-js')) return
    
    // 确保 pJSDom 是数组（可能被之前的 destroypJS 设为 null）
    if (!window.pJSDom) {
      window.pJSDom = []
    }
    
    isInitialized.current = true
    
    const config = {
      particles: {
        number: { 
          value: Math.floor(window.innerWidth / 15),
          density: { enable: true }
        },
        color: { value: ["#60a5fa", "#93c5fd", "#3b82f6"] }, // 蓝色系
        shape: { type: "circle" },
        opacity: { 
          value: 0.6,
          random: true 
        },
        size: { 
          value: 2,
          random: { min: 1, max: 3 } 
        },
        line_linked: {
          distance: 120,
          color: "#60a5fa",
          opacity: 0.3,
          width: 1
        },
        move: {
          enable: true,
          speed: 0.6,
          direction: "none",
          out_mode: "bounce"
        }
      },
      interactivity: {
        detect_on: "window",
        events: {
          onhover: { enable: true, mode: "repulse" }
        }
      }
    }
    
    window.particlesJS('particles-js', config)
    
    // 窗口大小变化时防抖重置
    let resizeTimer: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        // 确保 pJSDom 是数组
        if (!window.pJSDom) {
          window.pJSDom = []
        }
        if (window.pJSDom.length > 0) {
          window.pJSDom[0].pJS.fn.vendors.destroypJS()
          // destroypJS 会将 pJSDom 设为 null，需要恢复
          if (!window.pJSDom) {
            window.pJSDom = []
          }
        }
        window.particlesJS('particles-js', config)
      }, 250)
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimer)
      // 清理粒子实例
      if (window.pJSDom && window.pJSDom.length > 0) {
        window.pJSDom[0].pJS.fn.vendors.destroypJS()
      }
      // 重置初始化标志，确保组件重新挂载时可以正常初始化
      isInitialized.current = false
      // 修复：destroypJS 会将 pJSDom 设为 null，需要恢复为数组
      if (window.pJSDom === null) {
        window.pJSDom = []
      }
    }
  }, [])


  console.log("图片路径:", loginBg);

  return (
    <>
      <Script 
        src="/js/particles.js" 
        strategy="afterInteractive"
        onLoad={() => {
          // Script加载完成后，useEffect会处理初始化
          // 确保 pJSDom 是数组（可能被之前的 destroypJS 设为 null）
          if (!window.pJSDom) {
            window.pJSDom = []
          }
          if (containerRef.current && window.particlesJS && !isInitialized.current) {
            isInitialized.current = true
            const config = {
              particles: {
                number: { 
                  value: Math.floor(window.innerWidth / 15),
                  density: { enable: true }
                },
                color: { value: ["#60a5fa", "#93c5fd", "#3b82f6"] },
                shape: { type: "circle" },
                opacity: { 
                  value: 0.6,
                  random: true 
                },
                size: { 
                  value: 2,
                  random: { min: 1, max: 3 } 
                },
                line_linked: {
                  distance: 120,
                  color: "#60a5fa",
                  opacity: 0.3,
                  width: 1
                },
                move: {
                  enable: true,
                  speed: 0.6,
                  direction: "none",
                  out_mode: "bounce"
                }
              },
              interactivity: {
                detect_on: "window",
                events: {
                  onhover: { enable: true, mode: "repulse" }
                }
              }
            }
            window.particlesJS('particles-js', config)
          }
        }}
      />
      <div 
        id="particles-js" 
        ref={containerRef}
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${loginBg.src})`,

          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
    </>
  )
}

// TypeScript 类型声明
declare global {
  interface Window {
    particlesJS: (tag_id: string, params: any) => void
    pJSDom: Array<{
      pJS: {
        fn: {
          vendors: {
            destroypJS: () => void
          }
        }
      }
    }>
  }
}
