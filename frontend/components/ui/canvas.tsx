"use client"

import { useEffect, useRef, useState } from "react"
import React from 'react'

interface CanvasProps {
  style?: React.CSSProperties
}

const Canvas: React.FC<CanvasProps> = ({ style }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Initialize variables
    const pos = { x: 0, y: 0 }
    let lines: Line[] = []
    let f: SineWave

    // Configuration
    const E = {
      debug: true,
      friction: 0.5,
      trails: 80,
      size: 50,
      dampening: 0.025,
      tension: 0.99,
    }

    // SineWave class
    class SineWave {
      phase: number
      offset: number
      frequency: number
      amplitude: number
      value = 0

      constructor(options: { phase?: number; offset?: number; frequency?: number; amplitude?: number } = {}) {
        this.phase = options.phase || 0
        this.offset = options.offset || 0
        this.frequency = options.frequency || 0.001
        this.amplitude = options.amplitude || 1
      }

      update() {
        this.phase += this.frequency
        this.value = this.offset + Math.sin(this.phase) * this.amplitude
        return this.value
      }
    }

    // Node class
    class Node {
      x = 0
      y = 0
      vx = 0
      vy = 0
    }

    // Line class
    class Line {
      spring: number
      friction: number
      nodes: Node[]

      constructor(options: { spring?: number } = {}) {
        this.spring = (options.spring || 0.45) + 0.1 * Math.random() - 0.05
        this.friction = E.friction + 0.01 * Math.random() - 0.005
        this.nodes = []

        for (let i = 0; i < E.size; i++) {
          const node = new Node()
          node.x = pos.x
          node.y = pos.y
          this.nodes.push(node)
        }
      }

      update() {
        let spring = this.spring
        let node = this.nodes[0]

        node.vx += (pos.x - node.x) * spring
        node.vy += (pos.y - node.y) * spring

        for (let i = 0, len = this.nodes.length; i < len; i++) {
          node = this.nodes[i]

          if (i > 0) {
            const prev = this.nodes[i - 1]
            node.vx += (prev.x - node.x) * spring
            node.vy += (prev.y - node.y) * spring
            node.vx += prev.vx * E.dampening
            node.vy += prev.vy * E.dampening
          }

          node.vx *= this.friction
          node.vy *= this.friction
          node.x += node.vx
          node.y += node.vy

          spring *= E.tension
        }
      }

      draw() {
        let x = this.nodes[0].x
        let y = this.nodes[0].y
        let nextNode, currentNode
        let i: number
        let len: number

        ctx!.beginPath()
        ctx!.moveTo(x, y)

        for (i = 1, len = this.nodes.length - 2; i < len; i++) {
          currentNode = this.nodes[i]
          nextNode = this.nodes[i + 1]
          x = 0.5 * (currentNode.x + nextNode.x)
          y = 0.5 * (currentNode.y + nextNode.y)
          ctx!.quadraticCurveTo(currentNode.x, currentNode.y, x, y)
        }

        currentNode = this.nodes[i]
        nextNode = this.nodes[i + 1]
        ctx!.quadraticCurveTo(currentNode.x, currentNode.y, nextNode.x, nextNode.y)
        ctx!.stroke()
        ctx!.closePath()
      }
    }

    // Initialize lines
    function initLines() {
      lines = []
      for (let i = 0; i < E.trails; i++) {
        lines.push(new Line({ spring: 0.45 + (i / E.trails) * 0.025 }))
      }
    }

    // Handle mouse/touch movement
    function handleMouseMove(e: MouseEvent | TouchEvent) {
      if ("touches" in e) {
        pos.x = e.touches[0].pageX
        pos.y = e.touches[0].pageY
      } else {
        pos.x = e.clientX
        pos.y = e.clientY
      }
      e.preventDefault()
    }

    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        pos.x = e.touches[0].pageX
        pos.y = e.touches[0].pageY
      }
    }

    // Resize canvas
    function resizeCanvas() {
      canvas.width = window.innerWidth - 20
      canvas.height = window.innerHeight
    }

    // Animation frame
    let animationFrameId: number
    let running = true
    let frame = 1

    function render() {
      if (!running) return

      ctx!.globalCompositeOperation = "source-over"
      ctx!.clearRect(0, 0, canvas.width, canvas.height)
      ctx!.globalCompositeOperation = "lighter"
      ctx!.strokeStyle = `hsla(${Math.round(f.update())},100%,50%,0.025)`
      ctx!.lineWidth = 10

      for (let i = 0; i < E.trails; i++) {
        const line = lines[i]
        line.update()
        line.draw()
      }

      frame++
      animationFrameId = window.requestAnimationFrame(render)
    }

    // Initialize
    f = new SineWave({
      phase: Math.random() * 2 * Math.PI,
      amplitude: 85,
      frequency: 0.0015,
      offset: 285,
    })

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("touchmove", handleMouseMove)
    document.addEventListener("touchstart", handleTouchStart)
    window.addEventListener("resize", resizeCanvas)
    document.body.addEventListener("orientationchange", resizeCanvas)

    window.addEventListener("focus", () => {
      if (!running) {
        running = true
        render()
      }
    })

    window.addEventListener("blur", () => {
      running = true
    })

    resizeCanvas()
    initLines()
    render()

    // Cleanup
    return () => {
      running = false
      window.cancelAnimationFrame(animationFrameId)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("touchmove", handleMouseMove)
      document.removeEventListener("touchstart", handleMouseMove)
      window.removeEventListener("resize", resizeCanvas)
      document.body.removeEventListener("orientationchange", resizeCanvas)
      window.removeEventListener("focus", () => {})
      window.removeEventListener("blur", () => {})
    }
  }, [])

  useEffect(() => {
    // 初始化完成后
    setIsLoading(false)
  }, [])

  return <canvas id="canvas" ref={canvasRef} className="fixed top-0 left-0 w-full h-full touch-none" style={style} />
}

export default Canvas

