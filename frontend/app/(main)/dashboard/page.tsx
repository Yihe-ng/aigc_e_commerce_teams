import { redirect } from "next/navigation"

/** `dashboard` 仅承载数据统计相关路由；根路径进入数据概览 */
export default function DashboardIndexPage() {
  redirect("/dashboard/analytics/merchant-source")
}
