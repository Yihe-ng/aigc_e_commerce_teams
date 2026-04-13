"use client"

import { Avatar, Button, Card, Chip, Tooltip } from "@heroui/react"
import { CheckCircle2, Copy, Lightbulb, RefreshCw, Sparkles } from "lucide-react"

import {
  extractQuestionsFromContent,
  extractHashtagsFromContent,
  removeSectionTitles,
} from "./message-format"
import styles from "./ai-message.module.css"

interface AIMessageProps {
  content: string
  tags?: string[]
  questions?: string[]
  isStreaming?: boolean
  interactionsDisabled?: boolean
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
  interactionsDisabled = false,
  onRegenerate,
  onCopy,
  onQuestionClick,
  onAdopt,
}: AIMessageProps) {
  const rawContent = String(content || "")
  const { cleanContent: contentWithoutHashtags, hashtags: parsedHashtags } =
    extractHashtagsFromContent(rawContent)
  const { cleanContent: contentWithoutQuestions, questions: parsedQuestions } =
    extractQuestionsFromContent(contentWithoutHashtags)
  const formattedContent = removeSectionTitles(contentWithoutQuestions)
  // 关键节点: 统一使用格式化后的内容，确保流式和非流式状态下显示一致
  const displayedContent = formattedContent
  const allQuestions = questions.length > 0 ? questions : parsedQuestions
  const allTags = tags.length > 0 ? tags : parsedHashtags

  return (
    <div className="flex max-w-[75%] gap-3">
      <Avatar className="mt-[2px] flex-shrink-0 bg-indigo-600 text-white" size="sm">
        <Avatar.Fallback>
          <Sparkles className="h-4 w-4" />
        </Avatar.Fallback>
      </Avatar>

      <Card className="flex-1 rounded-2xl rounded-tl-sm border-0 bg-white shadow-sm transition-all duration-300 ease-out dark:bg-slate-800/90 dark:ring-1 dark:ring-white/10">
        <Card.Content className="p-4">
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-slate-100">
            {displayedContent}
            {isStreaming && (
              <span className={styles.typingCursor} aria-hidden="true" />
            )}
          </div>

          {allTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-slate-700">
              {allTags.map((tag) => (
                <Chip
                  key={tag}
                  size="sm"
                  className="border-0 bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300"
                >
                  {tag}
                </Chip>
              ))}
            </div>
          )}

          {allQuestions.length > 0 && (
            <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-700/50">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200">
                <Lightbulb className="h-4 w-4 text-[#91C1FA]" />
                <span>追问</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allQuestions.map((question) => (
                  <Button
                    key={question}
                    variant="ghost"
                    size="sm"
                    aria-label={`Ask question: ${question}`}
                    isDisabled={interactionsDisabled || isStreaming}
                    onPress={() => onQuestionClick?.(question)}
                    className="h-auto rounded-xl border-0 bg-[#EFEFEF] px-3 py-2 text-xs text-gray-700 transition-all duration-200 hover:bg-[#E5E5E5] hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91C1FA] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-100 dark:focus-visible:ring-offset-slate-900"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            {onAdopt && formattedContent.trim().length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                isDisabled={interactionsDisabled || isStreaming}
                onPress={() => onAdopt(formattedContent)}
                className="rounded-lg bg-[#EEF6FF] text-[#3B82F6] hover:bg-[#E0EEFF] dark:bg-sky-950/50 dark:text-sky-400 dark:hover:bg-sky-950/70"
              >
                <CheckCircle2 className="h-4 w-4" />
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
                    isDisabled={interactionsDisabled || isStreaming}
                    onPress={() => {
                      onRegenerate?.()
                    }}
                    className="
                      rounded-lg
                      bg-transparent
                      text-gray-400
                      transition-all duration-200
                      hover:bg-gray-100
                      hover:text-gray-600
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white
                      dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 dark:focus-visible:ring-sky-500 dark:focus-visible:ring-offset-slate-800
                    "
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <p>重新生成</p>
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
                    onPress={() => {
                      onCopy?.()
                    }}
                    className="
                      rounded-lg
                      bg-transparent
                      text-gray-400
                      transition-all duration-200
                      hover:bg-gray-100
                      hover:text-gray-600
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white
                      dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 dark:focus-visible:ring-sky-500 dark:focus-visible:ring-offset-slate-800
                    "
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <p>复制</p>
                </Tooltip.Content>
              </Tooltip>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}
