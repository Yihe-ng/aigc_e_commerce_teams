export function normalizeQuestionsPayload(rawQuestions: unknown): string[] {
  if (!rawQuestions) {
    return []
  }

  if (Array.isArray(rawQuestions)) {
    return rawQuestions
      .map((question) => String(question || "").trim())
      .filter(Boolean)
  }

  let jsonStr = String(rawQuestions).trim()
  if (!jsonStr) {
    return []
  }

  const firstBracket = jsonStr.indexOf("[")
  const lastBracket = jsonStr.lastIndexOf("]")

  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    jsonStr = jsonStr.slice(firstBracket, lastBracket + 1)
  }

  try {
    const parsed = JSON.parse(jsonStr)
    return Array.isArray(parsed)
      ? parsed.map((question) => String(question || "").trim()).filter(Boolean)
      : []
  } catch {
    return []
  }
}

export function extractQuestionsFromContent(rawContent: unknown): {
  cleanContent: string
  questions: string[]
} {
  const content = String(rawContent || "")
  const completeMatch = content.match(/<<<\s*Questions\s*:\s*([\s\S]*?)\s*>>>/i)

  if (completeMatch) {
    const questions = normalizeQuestionsPayload(completeMatch[1])
    return {
      cleanContent: content.replace(completeMatch[0], "").trim(),
      questions,
    }
  }

  const incompleteIndex = content.search(/<<<\s*Questions\s*:/i)
  if (incompleteIndex !== -1) {
    return {
      cleanContent: content.slice(0, incompleteIndex).trim(),
      questions: [],
    }
  }

  return {
    cleanContent: content.trim(),
    questions: [],
  }
}

export function extractHashtagsFromContent(content: string): {
  cleanContent: string
  hashtags: string[]
} {
  // 匹配多种 hashtags 格式：
  // 1. hashtags: #标签1 #标签2
  // 2. 【标签】#标签1 #标签2
  // 3. 标签：#标签1 #标签2
  const hashtagPatterns = [
    /hashtags:\s*(#[^\n]+)/i,
    /【标签】\s*(#[^\n]+)/,
    /标签[：:]\s*(#[^\n]+)/,
  ]

  for (const pattern of hashtagPatterns) {
    const hashtagMatch = content.match(pattern)
    if (hashtagMatch) {
      const hashtagText = hashtagMatch[1].trim()
      // 提取所有 #开头的标签（支持中文、英文、数字、下划线）
      const hashtags = hashtagText.match(/#[\u4e00-\u9fa5\u3000-\u303fa-zA-Z0-9_]+/g) || []
      // 移除 hashtags 行，保留其他内容
      const cleanContent = content.replace(pattern, "").trim()
      return { cleanContent, hashtags }
    }
  }

  return { cleanContent: content.trim(), hashtags: [] }
}

export function removeSectionTitles(content: string): string {
  // 移除常见的标题格式
  const titlePatterns = [
    /^文案主体内容[：:]\s*/im,
    /^【文案主体】\s*/im,
    /^文案主体\s*/im,
    /^【标签】\s*/im,
    /^【追问】\s*$/im,
    /^标签[：:]\s*$/im,
    /^追问[：:]\s*$/im,
  ]

  let cleanedContent = content
  for (const pattern of titlePatterns) {
    cleanedContent = cleanedContent.replace(pattern, "")
  }

  return cleanedContent.trim()
}

export function getUserMessageBubbleClassName(): string {
  return [
    "w-fit",
    "min-w-[96px]",
    "max-w-[75%]",
    "bg-[#91C1FA]",
    "dark:bg-[#2982CB]",
    "text-white",
    "rounded-2xl",
    "rounded-tr-sm",
    "border-0",
    "shadow-sm",
    "transition-all",
    "duration-200",
    "ease-out",
  ].join(" ")
}
