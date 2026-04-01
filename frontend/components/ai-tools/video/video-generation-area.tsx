'use client'

import { Card, ProgressBar } from '@heroui/react'
import { Film, PlayCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

import './video-generation.css'

interface VideoGenerationAreaProps {
  state: 'empty' | 'generating' | 'completed'
  videoUrl?: string | null
  progress: number
  statusText: string
  elapsedTime: number
  className?: string
}

function FallingPetalsLoader() {
  return (
    <div className='sparkle-loader' aria-hidden='true'>
      <SparkleIcon className='sparkle sparkle-one' suffix='one' />
      <SparkleIcon className='sparkle sparkle-two' suffix='two' />
      <SparkleIcon className='sparkle sparkle-three' suffix='three' />
    </div>
  )
}

interface SparkleIconProps {
  className: string
  suffix: string
}

function SparkleIcon({ className, suffix }: SparkleIconProps) {
  const shineId = `sparkle-shine-${suffix}`
  const maskId = `sparkle-mask-${suffix}`
  const gradient1Id = `sparkle-gradient-1-${suffix}`
  const gradient2Id = `sparkle-gradient-2-${suffix}`
  const gradient3Id = `sparkle-gradient-3-${suffix}`
  const gradient4Id = `sparkle-gradient-4-${suffix}`
  const gradient5Id = `sparkle-gradient-5-${suffix}`

  return (
    <svg
      className={className}
      viewBox='0 0 100 100'
      xmlns='http://www.w3.org/2000/svg'
      xmlnsXlink='http://www.w3.org/1999/xlink'
    >
      <defs>
        <filter id={shineId}>
          <feGaussianBlur stdDeviation='3' />
        </filter>
        <mask id={maskId}>
          <path
            d='M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z'
            fill='white'
          />
        </mask>
        <radialGradient
          id={gradient1Id}
          cx='50'
          cy='66'
          fx='50'
          fy='66'
          r='30'
          gradientTransform='translate(0 35) scale(1 0.5)'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0%' stopColor='black' stopOpacity='0.3' />
          <stop offset='50%' stopColor='black' stopOpacity='0.1' />
          <stop offset='100%' stopColor='black' stopOpacity='0' />
        </radialGradient>
        <radialGradient
          id={gradient2Id}
          cx='55'
          cy='20'
          fx='55'
          fy='20'
          r='30'
          gradientUnits='userSpaceOnUse'
        >
          <stop offset='0%' stopColor='white' stopOpacity='0.35' />
          <stop offset='50%' stopColor='white' stopOpacity='0.12' />
          <stop offset='100%' stopColor='white' stopOpacity='0' />
        </radialGradient>
        <radialGradient id={gradient3Id} cx='85' cy='50' fx='85' fy='50' xlinkHref={`#${gradient2Id}`} />
        <radialGradient
          id={gradient4Id}
          cx='50'
          cy='58'
          fx='50'
          fy='58'
          r='60'
          gradientTransform='translate(0 47) scale(1 0.2)'
          xlinkHref={`#${gradient3Id}`}
        />
        <linearGradient id={gradient5Id} x1='50' y1='90' x2='50' y2='10' gradientUnits='userSpaceOnUse'>
          <stop offset='0%' stopColor='black' stopOpacity='0.2' />
          <stop offset='40%' stopColor='black' stopOpacity='0' />
        </linearGradient>
      </defs>
      <g>
        <path
          d='M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z'
          fill='currentColor'
        />
        <path
          d='M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z'
          fill={`url(#${gradient1Id})`}
        />
        <path
          d='M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z'
          fill='none'
          stroke='white'
          opacity='0.3'
          strokeWidth='3'
          filter={`url(#${shineId})`}
          mask={`url(#${maskId})`}
        />
        <path
          d='M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z'
          fill={`url(#${gradient2Id})`}
        />
        <path
          d='M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z'
          fill={`url(#${gradient3Id})`}
        />
        <path
          d='M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z'
          fill={`url(#${gradient4Id})`}
        />
        <path
          d='M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z'
          fill={`url(#${gradient5Id})`}
        />
      </g>
    </svg>
  )
}

function formatElapsedTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds} 秒`
  }

  return `${minutes} 分 ${remainingSeconds} 秒`
}

export function VideoGenerationArea({
  state,
  videoUrl,
  progress,
  statusText,
  elapsedTime,
  className,
}: VideoGenerationAreaProps) {
  if (state === 'empty') {
    return (
      <Card
        className={cn(
          'h-full min-h-[520px] rounded-xl border-0 bg-[#F8F8F8] shadow-none',
          className
        )}
      >
        <Card.Content className='flex h-full min-h-[520px] flex-col items-center justify-center gap-4 p-6 text-center'>
          <Film className='h-16 w-16 text-gray-300' />
          <div>
            <p className='text-lg font-medium text-gray-700'>等待生成视频</p>
            <p className='mt-2 text-sm text-gray-400'>
              选择商品并填写视频描述后，这里会展示生成结果。
            </p>
          </div>
        </Card.Content>
      </Card>
    )
  }

  if (state === 'generating') {
    return (
      <Card
        className={cn(
          'h-full min-h-[520px] rounded-xl border-0 bg-[#F8F8F8] shadow-none',
          className
        )}
      >
        <Card.Content className='flex h-full min-h-[520px] flex-col items-center justify-center gap-6 p-6'>
          <FallingPetalsLoader />

          <div className='space-y-2 text-center'>
            <p className='text-lg font-medium text-gray-700'>{statusText}</p>
            <p className='text-sm text-gray-500'>
              已耗时 {formatElapsedTime(elapsedTime)}
            </p>
          </div>

          <div className='w-full max-w-72'>
            <ProgressBar aria-label='视频生成进度' className='w-full' value={progress}>
              <ProgressBar.Track className='h-3 rounded-full bg-white'>
                <ProgressBar.Fill className='rounded-full bg-[#91C1FA]' />
              </ProgressBar.Track>
            </ProgressBar>
            <div className='mt-3 text-center text-sm font-medium text-[#91C1FA]'>
              {progress}%
            </div>
          </div>
        </Card.Content>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'h-full min-h-[520px] rounded-xl border-0 bg-[#F8F8F8] shadow-none',
        className
      )}
    >
      <Card.Content className='flex h-full min-h-[520px] items-center justify-center p-4'>
        {videoUrl ? (
          <div className='flex h-full w-full items-center justify-center rounded-xl bg-black p-4'>
            <video
              className='max-h-[500px] w-auto rounded-lg'
              controls
              src={videoUrl}
              style={{ aspectRatio: '9 / 16' }}
            />
          </div>
        ) : (
          <div className='flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-xl bg-white text-center text-gray-400'>
            <PlayCircle className='h-14 w-14 text-gray-300' />
            <p className='text-sm'>视频地址缺失，暂时无法播放。</p>
          </div>
        )}
      </Card.Content>
    </Card>
  )
}
