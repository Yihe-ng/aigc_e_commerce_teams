export type PlatformName = "小红书" | "抖音" | "朋友圈"

export interface PlatformDraft {
  content: string
  tags: string
}

export interface MediaItem {
  id: string
  url: string
}

export interface PlatformInfo {
  name: PlatformName
  color: string
  hover: string
  aiPrompt: string
}
