'use client'

import { Card, ProgressBar } from '@heroui/react'
import { Clock3, LoaderCircle } from 'lucide-react'

interface GenerationProgressProps {
  progress: number
  elapsedTime: number
  statusText: string
  title?: string
  ariaLabel?: string
}

function formatElapsedTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds} 秒`
  }

  return `${minutes} 分 ${remainingSeconds} 秒`
}

export function GenerationProgress({
  progress,
  elapsedTime,
  statusText,
  title = '生成进度',
  ariaLabel = '生成进度',
}: GenerationProgressProps) {
  return (
    <Card className='rounded-xl border-0 bg-[#F8F8F8] shadow-none dark:bg-slate-900/90 dark:ring-1 dark:ring-white/10'>
      <Card.Header className='border-b border-gray-200 px-5 py-4 dark:border-slate-700'>
        <div className='flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-slate-100'>
          <LoaderCircle className='h-4 w-4 animate-spin text-[#91C1FA]' />
          {title}
        </div>
      </Card.Header>
      <Card.Content className='space-y-4 p-5'>
        <ProgressBar aria-label={ariaLabel} className='w-full' value={progress}>
          <ProgressBar.Track className='h-3 rounded-full bg-white dark:bg-slate-800'>
            <ProgressBar.Fill className='rounded-full bg-[#91C1FA]' />
          </ProgressBar.Track>
        </ProgressBar>

        <div className='flex items-center justify-between gap-3 text-sm text-gray-500 dark:text-slate-400'>
          <span>{progress}%</span>
          <span className='text-right'>{statusText}</span>
        </div>

        <div className='flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-gray-600 dark:bg-slate-800/80 dark:text-slate-300'>
          <Clock3 className='h-4 w-4 text-[#91C1FA]' />
          <span>已耗时 {formatElapsedTime(elapsedTime)}</span>
        </div>
      </Card.Content>
    </Card>
  )
}
