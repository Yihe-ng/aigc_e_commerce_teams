"use client"

import { useEffect, useRef, useState } from "react"

import { ClearConfirmModal } from "./clear-confirm-modal"
import { FullscreenEditorModal } from "./fullscreen-editor-modal"
import { MediaPanel } from "./media-panel"
import { NotesEditor } from "./notes-editor"
import { PlatformSwitcher } from "./platform-switcher"
import type { MediaItem, PlatformDraft, PlatformInfo, PlatformName } from "./types"

const PLATFORM_INFOS: PlatformInfo[] = [
  { name: "小红书", color: "bg-red-500", hover: "hover:bg-red-50", aiPrompt: "种草/评测风" },
  { name: "抖音", color: "bg-slate-900", hover: "hover:bg-slate-100", aiPrompt: "爆款/带货风" },
  { name: "朋友圈", color: "bg-emerald-500", hover: "hover:bg-emerald-50", aiPrompt: "私域/熟人风" },
]

const EMPTY_DRAFTS: Record<PlatformName, PlatformDraft> = {
  小红书: { content: "", tags: "" },
  抖音: { content: "", tags: "" },
  朋友圈: { content: "", tags: "" },
}

function randomId() {
  return Math.random().toString(36).slice(2)
}

export default function MarketingNotesContent() {
  const [platform, setPlatform] = useState<PlatformName>("小红书")
  const [globalTitle, setGlobalTitle] = useState("")
  const originalTitleRef = useRef("")
  const [drafts, setDrafts] = useState<Record<PlatformName, PlatformDraft>>(EMPTY_DRAFTS)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem("marketing_notes_draft")
      if (!savedDraft) return

      const parsed = JSON.parse(savedDraft) as {
        globalTitle?: string
        drafts?: Record<PlatformName, PlatformDraft>
        mediaList?: MediaItem[]
      }

      if (parsed.globalTitle) {
        setGlobalTitle(parsed.globalTitle)
        originalTitleRef.current = parsed.globalTitle
      }
      if (parsed.drafts) {
        setDrafts(parsed.drafts)
      }
      if (parsed.mediaList) {
        setMediaList(parsed.mediaList)
      }
    } catch (error) {
      console.error("读取草稿失败", error)
    }
  }, [])

  const currentDraft = drafts[platform]
  const currentPlatformInfo = PLATFORM_INFOS.find((item) => item.name === platform)

  const updateDraft = (field: keyof PlatformDraft, value: string) => {
    setDrafts((current) => ({
      ...current,
      [platform]: {
        ...current[platform],
        [field]: value,
      },
    }))
  }

  const handleSaveDraft = () => {
    // 这里保留浏览器本地草稿方案，后续如果切到后端持久化，可直接替换这一段。
    const draftData = {
      globalTitle,
      drafts,
      mediaList: mediaList.filter((item) => item.url.startsWith("http")),
    }
    localStorage.setItem("marketing_notes_draft", JSON.stringify(draftData))
    alert("草稿已安全保存在浏览器本地！刷新页面也不会丢失哦~")
  }

  const handleGenerate = () => {
    if (!globalTitle && !currentDraft.content) {
      alert("请先输入产品名称或简单卖点哦！")
      return
    }

    setIsGenerating(true)

    // 这里继续保留原提交里的 mock 文案生成逻辑，后续如果接真实 AI 接口，优先替换这一段。
    window.setTimeout(() => {
      const baseTitle = originalTitleRef.current || "爆款好物"
      const firstBlock = currentDraft.content.split(/━\s*━\s*━/)[0]?.trim() ?? ""
      const aiKeywords = [
        "救命😱",
        "【真实体验】",
        "【深度评测】",
        "【避坑总结】",
        "【送礼理由】",
        "【省钱方案】",
        "家人们，谁懂啊",
        "给大家安利",
        "宝藏单品",
      ]

      const isTainted = aiKeywords.some((keyword) => firstBlock.includes(keyword))
      const baseContent =
        isTainted || !firstBlock
          ? "这个产品真的很不错，推荐大家购买。"
          : firstBlock

      let newTitle = ""
      let generatedContent = ""
      let newTags = ""

      const versionMatches = currentDraft.content.match(/━ 🧙‍♂️ AI 智创/g)
      const nextVersionNumber = versionMatches ? versionMatches.length + 1 : 1
      const type = (nextVersionNumber - 1) % 5

      if (platform === "小红书") {
        const templates = [
          {
            title: `✨被问爆了！${baseTitle.slice(0, 10)}绝了😭`,
            content: `救命😱！今天和大家分享一个最近用到哭的宝藏。\n\n💡【真实体验】\n${baseContent}\n\n按头安利👍！\n\n@薯队长 @小红书成长助手`,
          },
          {
            title: `❓关于${baseTitle.slice(0, 10)}别乱买...`,
            content: `姐妹们，真心建议！入手前先看看这篇👇\n\n📖【深度评测】\n${baseContent}\n\n总结：冲就完事了🔥！`,
          },
          {
            title: `🔥整理了${baseTitle.slice(0, 10)}避坑指南`,
            content: `真心建议所有人闭眼冲🔥！\n\n💡【避坑总结】\n${baseContent}\n\n亲测有效💯！`,
          },
          {
            title: `🎁节日送啥？${baseTitle.slice(0, 10)}太香了`,
            content: `选这个绝对不会出错！\n\n🎀【送礼理由】\n${baseContent}\n\n收到的人绝对会尖叫🌟！`,
          },
          {
            title: `✅${baseTitle.slice(0, 10)}性价比之王`,
            content: `不允许姐妹们还不知道这个宝藏✨！\n\n💰【省钱方案】\n${baseContent}\n\n赶紧囤货👍！`,
          },
        ]
        newTitle = templates[type].title
        generatedContent = templates[type].content
        newTags = "#好物分享 #平价好物 #种草"
      } else if (platform === "抖音") {
        const templates = [
          {
            title: `🔥${baseTitle.slice(0, 15)}，抢疯了！`,
            content: `家人们，终于到手了🔥！\n\n${baseContent}\n\n今天在直播间只要 XX😱！点左下角 👇👇`,
          },
          {
            title: `⚠️爆款预警！ ${baseTitle.slice(0, 15)}`,
            content: `刚拿到的快递，惊呆了😱！\n\n📹【开箱测试】\n${baseContent}\n\n点赞收藏，手慢无👇👇`,
          },
          {
            title: `😱别买贵了！${baseTitle.slice(0, 15)}底价`,
            content: `这波毛必须羊🐑！老板大出血：\n\n${baseContent}\n\n直接冲，不好用找我😎！👇👇`,
          },
          {
            title: `✅${baseTitle.slice(0, 15)}保姆级教程`,
            content: `展示什么叫：短平快！\n\n${baseContent}\n\n回去照着买就完了！手慢无哈👇👇`,
          },
          {
            title: `🎁老板哭惨，${baseTitle.slice(0, 15)}最后10单`,
            content: `终于拿到了🎉！只要 XX😱！\n\n${baseContent}\n\n最后10单，冲👇👇！`,
          },
        ]
        newTitle = templates[type].title
        generatedContent = templates[type].content
        newTags = "#抖音好物推荐 #爆款 #直播切片"
      } else {
        const templates = [
          `安利最近卖爆的好物🎉\n我自己也在用，真的很香！\n\n${baseContent}\n\n私信我哦，留了福利🎁🙏`,
          `收到超级多好评，靠口碑说话👍！\n\n${baseContent}\n\n数量不多了，先到先得哈🎈😎`,
          `内部福利来啦🎉！老板给体验价。\n\n${baseContent}\n\n暗号：体验，手慢无🙏！`,
          `性价比太高了，忍不住分享！\n\n${baseContent}\n\n需要的姐妹抓紧，晚了没了🌸🙏`,
          `🎉限时秒杀开启！错过等一年✨\n\n${baseContent}\n\n需要的赶紧，手慢无👍😎`,
        ]
        newTitle = baseTitle
        generatedContent = templates[type]
        newTags = ""
      }

      const timestamp = new Date().toLocaleTimeString("zh-CN", { hour12: false })
      const prefix = currentDraft.content.trim() === "" ? "" : "\n\n"
      const separator = `${prefix}━ ━ ━ ━ ━ ━ ━ ━ 🧙‍♂️ AI 智创 #${nextVersionNumber} [时: ${timestamp}] ━ ━ ━ ━ ━ ━ ━ ━\n\n`
      const finalContent = currentDraft.content + separator + generatedContent

      setGlobalTitle(newTitle)
      setDrafts((current) => ({
        ...current,
        [platform]: {
          content: finalContent,
          tags: newTags,
        },
      }))
      setIsGenerating(false)

      window.setTimeout(() => {
        textareaRef.current?.scrollTo({ top: textareaRef.current.scrollHeight })
      }, 100)
    }, 1500)
  }

  const handleUploadFiles = (files: FileList | null) => {
    const nextFiles = Array.from(files ?? [])
    if (mediaList.length + nextFiles.length > 9) {
      alert("最多只能添加 9 张素材哦！")
      return
    }

    const nextMedia = nextFiles.map((file) => ({
      id: randomId(),
      url: URL.createObjectURL(file),
    }))
    setMediaList((current) => [...current, ...nextMedia])
  }

  const handleGenerateImage = () => {
    if (mediaList.length >= 9) {
      alert("素材库已满，可以先删除一些再生成。")
      return
    }

    setIsGeneratingImage(true)
    // 这里保留 mock 生图行为，后续如果接真实图片生成接口，优先替换这一段。
    window.setTimeout(() => {
      const nextId = randomId()
      setMediaList((current) => [
        ...current,
        {
          id: nextId,
          url: `https://picsum.photos/seed/${nextId}/400/500`,
        },
      ])
      setIsGeneratingImage(false)
    }, 2000)
  }

  return (
    <div className="flex min-h-0 flex-col gap-6 rounded-[40px] bg-slate-50 p-4 md:p-6">
      <PlatformSwitcher
        currentPlatform={platform}
        isGenerating={isGenerating}
        platforms={PLATFORM_INFOS}
        onChangePlatform={setPlatform}
      />

      <div className="grid min-h-0 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <NotesEditor
          currentDraft={currentDraft}
          currentPlatformInfo={currentPlatformInfo}
          globalTitle={globalTitle}
          isGenerating={isGenerating}
          platform={platform}
          textareaRef={textareaRef}
          onChangeTitle={(title) => {
            setGlobalTitle(title)
            originalTitleRef.current = title
          }}
          onChangeContent={(content) => updateDraft("content", content)}
          onChangeTags={(tags) => updateDraft("tags", tags)}
          onGenerate={handleGenerate}
          onOpenClearConfirm={() => setShowClearConfirm(true)}
          onOpenFullscreen={() => setIsFullscreen(true)}
        />

        <div className="flex min-h-0 flex-col gap-6">
          <MediaPanel
            isGeneratingImage={isGeneratingImage}
            mediaList={mediaList}
            onDeleteMedia={(mediaId) =>
              setMediaList((current) => current.filter((item) => item.id !== mediaId))
            }
            onGenerateImage={handleGenerateImage}
            onUploadFiles={handleUploadFiles}
          />

          <div className="flex gap-4 rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex-1 rounded-2xl bg-slate-50 py-4 font-black text-slate-500 transition-all hover:bg-slate-100 active:scale-95"
            >
              保存草稿
            </button>
            <button
              type="button"
              className="flex-[2] rounded-2xl bg-blue-600 py-4 font-black text-white shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              立即发布至 {platform}
            </button>
          </div>
        </div>
      </div>

      <FullscreenEditorModal
        open={isFullscreen}
        platform={platform}
        content={currentDraft.content}
        onChangeContent={(content) => updateDraft("content", content)}
        onClose={() => setIsFullscreen(false)}
      />

      <ClearConfirmModal
        open={showClearConfirm}
        platform={platform}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          updateDraft("content", "")
          setShowClearConfirm(false)
        }}
      />
    </div>
  )
}
