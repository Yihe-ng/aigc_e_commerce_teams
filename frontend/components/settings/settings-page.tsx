"use client"

import { Button, Card, Checkbox, Input, Label, Tabs, TextField } from "@heroui/react"
import { KeyRound, Save } from "lucide-react"
import type { ReactNode } from "react"

import {
  cardDescriptionClass,
  FilterSelect,
  panelHoverClass,
  panelOnMutedBgClass,
} from "@/components/dashboard/dashboard-shared"
import { cn } from "@/lib/utils"

const LANG_ITEMS = [
  { id: "zh-CN", label: "简体中文" },
  { id: "en-US", label: "English" },
] as const

const TZ_ITEMS = [
  { id: "asia-shanghai", label: "Asia / Shanghai" },
  { id: "asia-hong-kong", label: "Asia / Hong Kong" },
] as const

function Panel(props: { className?: string; children: ReactNode }) {
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

function NotifyRow(props: { id: string; label: string; hint: string; defaultSelected?: boolean }) {
  const { id, label, hint, defaultSelected } = props
  return (
    <div className="flex items-start gap-3 rounded-lg py-2">
      <Checkbox name={id} defaultSelected={defaultSelected} className="mt-0.5 shrink-0">
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content className="gap-0.5">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>
        </Checkbox.Content>
      </Checkbox>
    </div>
  )
}

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <Card variant="secondary" className="p-6">
        <Card.Header>
          <Card.Title>系统设置</Card.Title>
          <Card.Description className={cardDescriptionClass}>
            语言、通知、账号安全与接口相关选项集中在此；当前为占位界面，接入后端后可对接真实配置与权限。
          </Card.Description>
        </Card.Header>
        <Card.Content className="gap-0 pt-2">
          <Tabs defaultSelectedKey="general" variant="secondary" className="w-full">
            <Tabs.ListContainer className="w-full overflow-x-auto">
              <Tabs.List aria-label="设置分类" className="min-w-0 flex-nowrap">
                <Tabs.Tab id="general">通用偏好</Tabs.Tab>
                <Tabs.Tab id="notifications">通知与提醒</Tabs.Tab>
                <Tabs.Tab id="security">安全与账号</Tabs.Tab>
                <Tabs.Tab id="integration">接口与集成</Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>

            <Tabs.Panel id="general" className="mt-6 outline-none">
              <Panel>
                <div className="flex flex-col gap-5">
                  <TextField className="w-full" name="displayName">
                    <Label>控制台显示名称</Label>
                    <Input placeholder="例如：华东运营组" variant="secondary" />
                  </TextField>
                  <FilterSelect label="界面语言" placeholder="请选择语言" defaultValue="zh-CN" items={[...LANG_ITEMS]} />
                  <FilterSelect label="时区" placeholder="请选择时区" defaultValue="asia-shanghai" items={[...TZ_ITEMS]} />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    浅色 / 深色主题请在顶栏切换，与全局外观一致。
                  </p>
                  <Button className="w-full sm:w-auto sm:self-start" onPress={() => {}}>
                    <Save className="size-4" aria-hidden />
                    保存通用设置
                  </Button>
                </div>
              </Panel>
            </Tabs.Panel>

            <Tabs.Panel id="notifications" className="mt-6 outline-none">
              <Panel>
                <div className="flex flex-col gap-1">
                  <NotifyRow
                    id="email-digest"
                    label="邮件摘要"
                    hint="每日汇总关键指标与待办"
                    defaultSelected
                  />
                  <NotifyRow id="browser" label="浏览器推送" hint="任务失败或审核待处理时提醒" />
                  <NotifyRow id="sms" label="短信（重要）" hint="仅用于高危安全事件" />
                  <div className="pt-4">
                    <Button className="w-full sm:w-auto sm:self-start" onPress={() => {}}>
                      <Save className="size-4" aria-hidden />
                      保存通知偏好
                    </Button>
                  </div>
                </div>
              </Panel>
            </Tabs.Panel>

            <Tabs.Panel id="security" className="mt-6 outline-none">
              <Panel>
                <div className="flex flex-col gap-5">
                  <TextField className="w-full" name="current" type="password">
                    <Label>当前密码</Label>
                    <Input placeholder="请输入当前密码" variant="secondary" />
                  </TextField>
                  <TextField className="w-full" name="next" type="password">
                    <Label>新密码</Label>
                    <Input placeholder="至少 8 位，含字母与数字" variant="secondary" />
                  </TextField>
                  <TextField className="w-full" name="confirm" type="password">
                    <Label>确认新密码</Label>
                    <Input placeholder="再次输入新密码" variant="secondary" />
                  </TextField>
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                    <p className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                      <KeyRound className="size-3.5 shrink-0" aria-hidden />
                      双因素认证
                    </p>
                    <p className="mt-1">接入企业 SSO 或 TOTP 后可在此开启；当前为占位说明。</p>
                  </div>
                  <Button className="w-full sm:w-auto sm:self-start" onPress={() => {}}>
                    <Save className="size-4" aria-hidden />
                    更新密码
                  </Button>
                </div>
              </Panel>
            </Tabs.Panel>

            <Tabs.Panel id="integration" className="mt-6 outline-none">
              <Panel>
                <div className="flex flex-col gap-5">
                  <TextField className="w-full" name="apiBase">
                    <Label>API 根地址</Label>
                    <Input placeholder="https://api.example.com" variant="secondary" />
                  </TextField>
                  <TextField className="w-full" name="tenantId">
                    <Label>租户 ID</Label>
                    <Input placeholder="可选，多租户场景填写" variant="secondary" />
                  </TextField>
                  <TextField className="w-full" name="apiKey" type="password">
                    <Label>API Key / Client Secret</Label>
                    <Input placeholder="勿将真实密钥提交到仓库" variant="secondary" />
                  </TextField>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Webhook 与第三方同步可在后续版本中扩展。
                  </p>
                  <Button className="w-full sm:w-auto sm:self-start" onPress={() => {}}>
                    <Save className="size-4" aria-hidden />
                    保存集成配置
                  </Button>
                </div>
              </Panel>
            </Tabs.Panel>
          </Tabs>
        </Card.Content>
      </Card>
    </div>
  )
}
