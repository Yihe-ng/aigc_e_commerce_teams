"use client"

import { useState, useEffect } from 'react'

export function useTypewriter(text: string, speed: number = 30) {
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (!text) {
      setDisplayText('')
      setIsTyping(false)
      return
    }

    setIsTyping(true)
    setDisplayText('')
    let index = 0

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1))
        index++
      } else {
        setIsTyping(false)
        clearInterval(timer)
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed])

  return { displayText, isTyping }
}