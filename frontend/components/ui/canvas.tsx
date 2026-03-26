"use client"

import { useEffect, useRef } from "react"
import React from 'react'

interface CanvasProps {
  style?: React.CSSProperties
}

const Canvas: React.FC<CanvasProps> = ({ style }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    
    // Mouse position
    const mouse = { x: -1000, y: -1000 }
    
    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      initParticles()
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    
    // Configuration from particles-init.js
    const colors = ["#5eead4", "#38bdf8", "#22d3ee"]
    const lineLinkColor = "rgba(94, 234, 212, 0.4)" 
    const connectDistance = 120
    const moveSpeed = 0.8
    const interactionDistance = 140 // Repulse radius

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      baseVx: number
      baseVy: number
    }

    let particles: Particle[] = []

    const initParticles = () => {
      particles = []
      const count = Math.floor(width / 15)
      for (let i = 0; i < count; i++) {
        const vx = (Math.random() - 0.5) * moveSpeed * 2
        const vy = (Math.random() - 0.5) * moveSpeed * 2
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: vx,
          vy: vy,
          baseVx: vx,
          baseVy: vy,
          size: Math.random() * 3 + 1,
          color: colors[Math.floor(Math.random() * colors.length)]
        })
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        
        // Interaction (Repulse)
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        
        if (dist < interactionDistance) {
          const angle = Math.atan2(dy, dx)
          const force = (interactionDistance - dist) / interactionDistance
          const repulseX = Math.cos(angle) * force * 5
          const repulseY = Math.sin(angle) * force * 5
          
          p.x -= repulseX
          p.y -= repulseY
        }

        // Move
        p.x += p.vx
        p.y += p.vy

        // Bounce
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        // Draw Point
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.7
        ctx.fill()
        
        // Draw Connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx2 = p.x - p2.x
          const dy2 = p.y - p2.y
          const dist2 = Math.sqrt(dx2*dx2 + dy2*dy2)

          if (dist2 < connectDistance) {
            ctx.beginPath()
            ctx.strokeStyle = lineLinkColor
            ctx.globalAlpha = 0.4 * (1 - dist2 / connectDistance)
            ctx.lineWidth = 1
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }
      
      requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    const animId = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #64748b 100%)', ...style }} 
    />
  )
}

export default Canvas
