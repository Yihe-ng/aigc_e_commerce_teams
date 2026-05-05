"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Button,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
  TextField,
  toast,
} from "@heroui/react"
import { Loader2, Save } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  panelHoverClass,
  panelOnMutedBgClass,
} from "@/components/dashboard/dashboard-shared"

// --- Panel (reused from settings-page.tsx) ---

function Panel(props: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl p-4 sm:p-5",
        panelOnMutedBgClass,
        panelHoverClass,
        props.className,
      )}
    >
      {props.children}
    </div>
  )
}

// --- Types ---

interface AttributeState {
  name: string
  gender: string
  age: string
  job: string
  hobby: string
  voice: string
  personaStyle: string
}

interface PerceptionState {
  chat: number
  follow: number
  gift: number
  indifferent: number
  join: number
}

interface InteractState {
  maxInteractTime: number
  playSound: boolean
  perception: PerceptionState
}

interface ConfigData {
  attribute: AttributeState
  interact: InteractState
}

// --- Constants ---

const PERSONA_STYLE_ITEMS = [
  { id: "vtuber_light", label: "轻快活泼（Vtuber风）" },
  { id: "professional", label: "专业理性" },
  { id: "natural", label: "自然随和" },
]

const PERCEPTION_KEYS: (keyof PerceptionState)[] = [
  "chat",
  "follow",
  "gift",
  "indifferent",
  "join",
]

const PERCEPTION_LABELS: Record<string, string> = {
  chat: "对话互动",
  follow: "关注",
  gift: "礼物",
  indifferent: "冷淡",
  join: "进入直播间",
}

const DEFAULT_ATTRIBUTE: AttributeState = {
  name: "",
  gender: "",
  age: "成年",
  job: "",
  hobby: "",
  voice: "",
  personaStyle: "",
}

const DEFAULT_PERCEPTION: PerceptionState = {
  chat: 29,
  follow: 29,
  gift: 29,
  indifferent: 29,
  join: 29,
}

// --- API helpers ---

async function fetchConfig(): Promise<Record<string, unknown>> {
  const res = await fetch("/api/runtime-config/digital-human")
  if (!res.ok) throw new Error(`GET 失败: ${res.status}`)
  const json = await res.json()
  if (json.status !== "success") throw new Error(json.error ?? "获取配置失败")
  return json.data as Record<string, unknown>
}

async function saveConfig(payload: {
  attribute: Record<string, unknown>
  interact: Record<string, unknown>
}): Promise<void> {
  const res = await fetch("/api/runtime-config/digital-human", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`POST 失败: ${res.status}`)
  const json = await res.json()
  if (json.status !== "success") throw new Error(json.error ?? "保存配置失败")
}

// --- Component ---

export function DigitalHumanSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [attribute, setAttribute] = useState<AttributeState>(DEFAULT_ATTRIBUTE)
  const [interact, setInteract] = useState<InteractState>({
    maxInteractTime: 15,
    playSound: true,
    perception: { ...DEFAULT_PERCEPTION },
  })

  const loadConfig = useCallback(async () => {
    try {
      const data = await fetchConfig()
      const attr = (data.attribute ?? {}) as Record<string, unknown>
      setAttribute({
        name: String(attr.name ?? ""),
        gender: String(attr.gender ?? ""),
        age: String(attr.age ?? "成年"),
        job: String(attr.job ?? ""),
        hobby: String(attr.hobby ?? ""),
        voice: String(attr.voice ?? ""),
        personaStyle: String(attr.persona_style ?? ""),
      })
      const inter = (data.interact ?? {}) as Record<string, unknown>
      const perception = (inter.perception ?? {}) as Record<string, unknown>
      setInteract({
        maxInteractTime: Number(inter.maxInteractTime ?? 15),
        playSound: Boolean(inter.playSound ?? true),
        perception: {
          chat: Number(perception.chat ?? 29),
          follow: Number(perception.follow ?? 29),
          gift: Number(perception.gift ?? 29),
          indifferent: Number(perception.indifferent ?? 29),
          join: Number(perception.join ?? 29),
        },
      })
    } catch (err: unknown) {
      toast(`加载配置失败: ${err instanceof Error ? err.message : "未知错误"}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveConfig({
        attribute: {
          name: attribute.name,
          gender: attribute.gender,
          age: attribute.age,
          job: attribute.job,
          hobby: attribute.hobby,
          voice: attribute.voice,
          persona_style: attribute.personaStyle,
        },
        interact: {
          maxInteractTime: interact.maxInteractTime,
          playSound: interact.playSound,
          perception: interact.perception,
        },
      })
      toast.success("数字人设置已保存")
    } catch (err: unknown) {
      toast(`保存失败: ${err instanceof Error ? err.message : "未知错误"}`)
    } finally {
      setSaving(false)
    }
  }

  const updateAttribute = (field: keyof AttributeState, value: string) => {
    setAttribute((prev) => ({ ...prev, [field]: value }))
  }

  const updatePerception = (field: keyof PerceptionState, value: number) => {
    setInteract((prev) => ({
      ...prev,
      perception: { ...prev.perception, [field]: value },
    }))
  }

  if (loading) {
    return (
      <Panel>
        <div className="flex items-center justify-center py-8 text-sm text-slate-500 dark:text-slate-400">
          加载中…
        </div>
      </Panel>
    )
  }

  return (
    <>
      <Panel>
        <div className="flex flex-col gap-6">
          {/* -- Persona Style (Select) -- */}
          <Select
            className="w-full sm:w-80"
            selectedKey={attribute.personaStyle || undefined}
            onSelectionChange={(key) => {
              updateAttribute("personaStyle", typeof key === "string" ? key : "")
            }}
            variant="secondary"
          >
            <Label>语言风格（Persona Style）</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {PERSONA_STYLE_ITEMS.map((item) => (
                  <ListBox.Item key={item.id} id={item.id} textValue={item.label}>
                    {item.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          {/* -- Name, Gender -- */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField className="w-full">
              <Label>名称</Label>
              <Input
                placeholder="例如：电商小助手"
                variant="secondary"
                value={attribute.name}
                onChange={(e) => updateAttribute("name", e.target.value)}
              />
            </TextField>
            <TextField className="w-full">
              <Label>性别</Label>
              <Input
                placeholder="男 / 女"
                variant="secondary"
                value={attribute.gender}
                onChange={(e) => updateAttribute("gender", e.target.value)}
              />
            </TextField>
          </div>

          {/* -- Age, Job -- */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField className="w-full">
              <Label>年龄</Label>
              <Input
                placeholder="例如：成年"
                variant="secondary"
                value={attribute.age}
                onChange={(e) => updateAttribute("age", e.target.value)}
              />
            </TextField>
            <TextField className="w-full">
              <Label>职业</Label>
              <Input
                placeholder="例如：主播带货"
                variant="secondary"
                value={attribute.job}
                onChange={(e) => updateAttribute("job", e.target.value)}
              />
            </TextField>
          </div>

          {/* -- Hobby, Voice -- */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField className="w-full">
              <Label>爱好</Label>
              <Input
                placeholder="例如：发呆"
                variant="secondary"
                value={attribute.hobby}
                onChange={(e) => updateAttribute("hobby", e.target.value)}
              />
            </TextField>
            <TextField className="w-full">
              <Label>音色</Label>
              <Input
                placeholder="例如：Qwen3-灵动女声"
                variant="secondary"
                value={attribute.voice}
                onChange={(e) => updateAttribute("voice", e.target.value)}
              />
            </TextField>
          </div>

          {/* -- Divider -- */}
          <div className="h-px bg-slate-200 dark:bg-slate-700" />

          {/* -- Interaction Settings -- */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              交互设置
            </h3>
            <div className="flex flex-col gap-5">
              <TextField className="w-full sm:w-60">
                <Label>最大交互时间（分钟）</Label>
                <Input
                  type="number"
                  variant="secondary"
                  value={String(interact.maxInteractTime)}
                  onChange={(e) =>
                    setInteract((prev) => ({
                      ...prev,
                      maxInteractTime: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                />
              </TextField>

              <Switch
                isSelected={interact.playSound}
                onChange={(v) =>
                  setInteract((prev) => ({ ...prev, playSound: v }))
                }
              >
                <Switch.Control>
                  <Switch.Icon />
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Content>播放声音</Switch.Content>
              </Switch>
            </div>
          </div>

          {/* -- Divider -- */}
          <div className="h-px bg-slate-200 dark:bg-slate-700" />

          {/* -- Perception Settings -- */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              感知权重
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PERCEPTION_KEYS.map((key) => (
                <div key={key} className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {PERCEPTION_LABELS[key]}
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={interact.perception[key]}
                    onChange={(e) => updatePerception(key, parseInt(e.target.value, 10))}
                    className="w-full accent-slate-700 dark:accent-slate-300"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {interact.perception[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* -- Save Button -- */}
          <div className="pt-2">
            <Button
              className="w-full sm:w-auto sm:self-start"
              onPress={handleSave}
              isDisabled={saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Save className="size-4" aria-hidden />
              )}
              {saving ? "保存中…" : "保存数字人设置"}
            </Button>
          </div>
        </div>

      </Panel>
    </>
  )
}
