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

export function getUserMessageBubbleClassName(): string {
  return [
    "w-fit",
    "min-w-[96px]",
    "max-w-[75%]",
    "bg-[#91C1FA]",
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
