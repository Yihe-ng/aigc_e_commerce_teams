import { MainLayout } from "@/components/layout/main-layout"

export default function AiToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
