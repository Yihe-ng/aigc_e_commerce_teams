"use client"

import { Avatar, Button, Card, Chip, Tooltip } from "@heroui/react"
import { CheckCircle2, Copy, Lightbulb, RefreshCw, Sparkles } from "lucide-react"
import { useTypewriter } from "@/lib/hooks/use-typewriter"
import { extractQuestionsFromContent } from "./message-format"

interface AIMessageProps {
  content: string
  tags?: string[]
  questions?: string[]
  isStreaming?: boolean
  onRegenerate?: () => void
  onCopy?: () => void
  onQuestionClick?: (question: string) => void
  onAdopt?: (content: string) => void
}

export function AIMessage({
  content,
  tags = [],
  questions = [],
  isStreaming = false,
  onRegenerate,
  onCopy,
  onQuestionClick,
  onAdopt,
}: AIMessageProps) {
  const { displayText, isTyping } = useTypewriter(isStreaming ? content : "", 30)

  const rawDisplayContent = isStreaming ? displayText : content
  const { cleanContent, questions: parsedQuestions } =
    extractQuestionsFromContent(rawDisplayContent)
  const allQuestions = questions.length > 0 ? questions : parsedQuestions

  return (
    <div className="flex max-w-[75%] gap-3">
      <Avatar className="mt-[2px] flex-shrink-0 bg-indigo-600 text-white" size="sm">
        <Avatar.Fallback>
          <Sparkles className="w-4 h-4" />
        </Avatar.Fallback>
      </Avatar>

      <Card className="flex-1 rounded-2xl rounded-tl-sm border border-gray-100 bg-white shadow-sm transition-all duration-300 ease-out">
        <Card.Content className="p-4">
          <div className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
            {cleanContent}
            {(isTyping || isStreaming) && <span className="typing-cursor" />}
          </div>

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  size="sm"
                  className="border-0 bg-gray-100 text-gray-600"
                >
                  #{tag}
                </Chip>
              ))}
            </div>
          )}

          {allQuestions.length > 0 && (
            <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Lightbulb className="h-4 w-4 text-[#91C1FA]" />
                <span>{"\u8ffd\u95ee"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allQuestions.map((question) => (
                  <Button
                    key={question}
                    variant="ghost"
                    size="sm"
                    aria-label={`Ask question: ${question}`}
                    onPress={() => onQuestionClick?.(question)}
                    className="h-auto rounded-xl border-0 bg-[#EFEFEF] px-3 py-2 text-xs text-gray-700 transition-all duration-200 hover:bg-[#E5E5E5] hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91C1FA] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            {onAdopt && cleanContent.trim().length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                isDisabled={isStreaming}
                onPress={() => onAdopt(cleanContent)}
                className="rounded-lg bg-[#EEF6FF] text-[#3B82F6] hover:bg-[#E0EEFF]"
              >
                <CheckCircle2 className="w-4 h-4" />
                采纳此方案
              </Button>
            )}
            {onRegenerate && (
              <Tooltip>
                <Tooltip.Trigger>
                  <Button
                    isIconOnly
                    size="sm"
                    aria-label="Regenerate response"
                    onPress={onRegenerate}
                    className="
                      rounded-lg
                      bg-transparent
                      text-gray-400
                      transition-all duration-200
                      hover:bg-gray-100
                      hover:text-gray-600
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white
                    "
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <p>{"\u91cd\u65b0\u751f\u6210"}</p>
                </Tooltip.Content>
              </Tooltip>
            )}
            {onCopy && (
              <Tooltip>
                <Tooltip.Trigger>
                  <Button
                    isIconOnly
                    size="sm"
                    aria-label="Copy message"
                    onPress={onCopy}
                    className="
                      rounded-lg
                      bg-transparent
                      text-gray-400
                      transition-all duration-200
                      hover:bg-gray-100
                      hover:text-gray-600
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white
                    "
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <p>{"\u590d\u5236"}</p>
                </Tooltip.Content>
              </Tooltip>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}
