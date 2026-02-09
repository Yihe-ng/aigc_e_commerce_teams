import LoginPage from '@/components/ui/login-page'
import CanvasBackground from '@/components/ui/canvas'

export default function Home() {
  return (
    <main className="relative h-screen w-full overflow-hidden">
      <CanvasBackground />
      <div className="absolute inset-0 flex items-center justify-center">
        <LoginPage />
      </div>
    </main>
  )
}
  