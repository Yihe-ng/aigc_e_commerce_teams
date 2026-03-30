import {
  BarChart3,
  CalendarDays,
  Database,
  FileText,
  ImageIcon,
  Images,
  LayoutDashboard,
  LineChart,
  NotebookPen,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  Video,
} from "lucide-react"

export const DASHBOARD_NAV = {
  label: "数据概览",
  icon: BarChart3,
  children: [
    { href: "/dashboard/analytics/merchant-source", label: "商家来源统计", icon: FileText },
    { href: "/dashboard/analytics/analyst", label: "商家分析看板", icon: LineChart },
    { href: "/dashboard/analytics/platform", label: "平台销售概览", icon: ShoppingBag },
  ],
} as const

export const DASHBOARD_MENU_KEYS = {
  merchantSource: "dashboard-merchant-source",
  analyst: "dashboard-analyst",
  platform: "dashboard-platform",
} as const

export const DASHBOARD_GROUP_EXPANDED_KEY = "dashboard-analytics-group-expanded"

export const CUSTOMERS_NAV = {
  label: "客户与营销",
  icon: Users,
  children: [
    { href: "/customers", label: "客户概览", icon: Users },
    { href: "/customers/marketing-schedule", label: "营销日程规划", icon: CalendarDays },
    { href: "/customers/marketing-notes", label: "营销笔记发布", icon: NotebookPen },
  ],
} as const

export const CUSTOMERS_MENU_KEYS = {
  overview: "customers-overview",
  marketingSchedule: "customers-marketing-schedule",
  marketingNotes: "customers-marketing-notes",
} as const

export const CUSTOMERS_GROUP_EXPANDED_KEY = "dashboard-customers-group-expanded"

export const WORKSPACE_NAV = {
  label: "工作台",
  icon: LayoutDashboard,
  children: [
    { href: "/ai-tools/textgenerate", label: "文案智造器", icon: FileText },
    { href: "/ai-tools/image", label: "营销图创作", icon: ImageIcon },
    { href: "/ai-tools/video", label: "短视频智造", icon: Video },
  ],
} as const

export const WORKSPACE_MENU_KEYS = {
  copywriting: "workspace-copywriting",
  marketingImages: "workspace-marketing-images",
  shortVideo: "workspace-short-video",
} as const

export const WORKSPACE_GROUP_EXPANDED_KEY = "dashboard-workspace-group-expanded"

export const PRODUCT_NAV = {
  label: "商品管理",
  icon: Package,
  children: [
    { href: "/products/basic", label: "商品基础信息库", icon: Database },
    { href: "/products/marketing", label: "商品营销素材库", icon: Images },
  ],
} as const

export const PRODUCT_MENU_KEYS = {
  basic: "product-basic",
  marketing: "product-marketing",
} as const

export const PRODUCT_GROUP_EXPANDED_KEY = "dashboard-product-group-expanded"

export const NAV_BOTTOM = [
  { href: "/live", label: "数字人直播", icon: Sparkles },
  { href: "/settings", label: "系统设置", icon: Settings },
] as const

export const BRAND_LOGO_SRC = `/images/${encodeURIComponent("智行合一logo.png")}`

export const SIDEBAR_COLLAPSED_KEY = "dashboard-sidebar-collapsed"
