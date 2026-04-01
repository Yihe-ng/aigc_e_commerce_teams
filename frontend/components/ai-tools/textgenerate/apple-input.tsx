"use client"

import { useState } from "react"
import { Button, Input } from "@heroui/react"
import { Search, Send } from "lucide-react"

interface AppleInputProps {
  onSend: (message: string) => void
  placeholder?: string
  disabled?: boolean
}

export function AppleInput({
  onSend,
  placeholder = "请在此键入你的需求",
  disabled = false,
}: AppleInputProps) {
  const [input, setInput] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const handleSend = () => {
    if (!input.trim() || disabled) return
    onSend(input.trim())
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={`
        w-full
        flex items-center gap-3
        rounded-2xl
        px-4 py-2.5
        transition-all duration-300 ease-out
        ${
          isFocused
            ? "shadow-[inset_2px_2px_5px_rgba(203,213,225,0.4),inset_4px_4px_10px_rgba(203,213,225,0.2),inset_-2px_-2px_6px_rgba(255,255,255,0.9),inset_0_0_12px_rgba(59,130,246,0.08)]"
            : "shadow-[inset_2px_2px_5px_rgba(203,213,225,0.6),inset_4px_4px_10px_rgba(203,213,225,0.3),inset_-2px_-2px_6px_rgba(255,255,255,0.9)]"
        }
      `}
      style={{ backgroundColor: "#F1F5F9" }}
    >
      <Search
        className={`
          w-5 h-5 flex-shrink-0
          transition-colors duration-200
          ${isFocused ? "text-blue-500" : "text-slate-400"}
        `}
      />

      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent border-0 text-slate-700 placeholder:text-slate-400"
        style={{
          backgroundColor: "transparent",
          boxShadow: "none",
        }}
      />

      <Button
        isIconOnly
        onPress={handleSend}
        isDisabled={!input.trim() || disabled}
        className={`
          rounded-full w-11 h-11
          flex-shrink-0
          transition-all duration-300 ease-out
          ${
            input.trim() && !disabled
              ? "bg-blue-500 text-white shadow-[0_4px_12px_rgba(59,130,246,0.35),0_2px_4px_rgba(59,130,246,0.25)] hover:shadow-[0_6px_16px_rgba(59,130,246,0.45),0_3px_6px_rgba(59,130,246,0.35)] hover:-translate-y-0.5 active:shadow-[0_2px_6px_rgba(59,130,246,0.3),inset_0_2px_4px_rgba(0,0,0,0.1)] active:translate-y-0.5"
              : "bg-slate-200 text-slate-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05),inset_-1px_-1px_2px_rgba(255,255,255,0.8)]"
          }
        `}
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  )
}
