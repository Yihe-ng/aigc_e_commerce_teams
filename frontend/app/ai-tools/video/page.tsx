import VideoGenerator from '@/components/ai-tools/video'

export default function VideoGenerationPage() {
  return (
    <div className='flex h-screen w-full overflow-hidden bg-white'>
      <aside className='hidden w-56 md:block' />
      <main className='flex min-h-0 flex-1 flex-col overflow-hidden'>
        <header className='h-16 flex-shrink-0' />
        <div className='min-h-0 flex-1 overflow-auto p-4 md:p-6'>
          <VideoGenerator />
        </div>
      </main>
    </div>
  )
}
