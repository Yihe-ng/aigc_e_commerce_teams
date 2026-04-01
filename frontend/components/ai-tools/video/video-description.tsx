'use client'

import { Card, Label, TextArea } from '@heroui/react'
import { FileText } from 'lucide-react'

interface VideoDescriptionProps {
  value: string
  onChange: (value: string) => void
  isDisabled?: boolean
}

export function VideoDescription({
  value,
  onChange,
  isDisabled = false,
}: VideoDescriptionProps) {
  return (
    <Card className='rounded-xl border-0 bg-[#F8F8F8] shadow-none'>
      <Card.Header className='border-b border-gray-200 px-5 py-4'>
        <div>
          <Card.Title className='text-base font-semibold text-gray-800'>
            视频描述
          </Card.Title>
          <Card.Description className='mt-1 text-sm text-gray-500'>
            用简洁语言描述你希望生成的视频内容和画面氛围。
          </Card.Description>
        </div>
      </Card.Header>
      <Card.Content className='space-y-3 p-5'>
        <Label className='flex items-center gap-2 text-sm font-medium text-gray-700'>
          <FileText className='h-4 w-4 text-[#91C1FA]' />
          描述文本
        </Label>
        <TextArea
          className='min-h-[120px] w-full rounded-xl border-0 bg-[#F1F5F9] px-4 py-3 text-sm text-gray-700 shadow-[inset_2px_2px_5px_rgba(203,213,225,0.6),inset_4px_4px_10px_rgba(203,213,225,0.3),inset_-2px_-2px_6px_rgba(255,255,255,0.9)] outline-none'
          disabled={isDisabled}
          placeholder='请输入视频描述内容，例如：视频是一个洗发露，背景出现花朵，镜头缓慢推进。'
          rows={5}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </Card.Content>
    </Card>
  )
}
