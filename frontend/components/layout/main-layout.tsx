"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarImage, Button, SearchFieldGroup } from "@heroui/react";
import {
  LayoutDashboard,
  Boxes,
  Share2,
  Users,
  Workflow,
  BarChart3,
  Cpu,
  Menu,
  Search,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { SearchField } from "@heroui/react";

type NavItem = {
  title: string;
  href?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  items?: Array<NavItem>;
};

const sidebarMenu: NavItem[] = [
  {
    title: "首页概览",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "商品信息管理",
    icon: Boxes,
    items: [
      { title: "商品基础信息库", href: "/products" },
      { title: "商品营销素材库", href: "/products/marketing" },
    ],
  },
  {
    title: "AI 营销创作",
    icon: Share2,
    items: [
      { title: "文案智造器", href: "/test/1" },
      { title: "营销图创作", href: "/test/2" },
      { title: "短视频智造", href: "/test/3" },
    ],
  },
  {
    title: "客户与运营",
    icon: Users,
    items: [
      { title: "客户分析", href: "/customers" },
      { title: "营销笔记", href: "/notes" },
      { title: "营销日程", href: "/calendar" },
    ],
  },
  {
    title: "系统工具",
    icon: Workflow,
    items: [
      { title: "配置中心", href: "/config" },
      { title: "运营设置", href: "/settings" },
      { title: "基础表格示例", href: "/tables/basic" },
    ],
  },
  {
    title: "数据统计",
    icon: BarChart3,
    items: [
      { title: "用户数据看板", href: "/dashboard" },
      { title: "程序员数据看板", href: "/dashboard/internal" },
    ],
  },
];

function SidebarLink({
  item,
  pathname,
  depth = 0,
}: {
  item: NavItem;
  pathname: string;
  depth?: number;
}) {
  const Icon = item.icon;
  const isActive = item.href
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : false;

  if (item.items && item.items.length > 0) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500/80">
          {item.title}
        </div>
        <div className="space-y-1">
          {item.items.map((child) => (
            <SidebarLink
              key={child.title}
              item={child}
              pathname={pathname}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
        depth > 0 ? "ml-3" : "",
        isActive
          ? "bg-white text-blue-600 shadow"
          : "text-slate-400 hover:bg-white/10 hover:text-white",
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{item.title}</span>
    </Link>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="flex h-full flex-col gap-6 rounded-2xl bg-slate-900/80 p-6 backdrop-blur-lg">
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="rounded-full bg-blue-500/20 p-2 text-blue-400">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-blue-200">智创电商</p>
          <p className="text-lg font-semibold text-white">营销驾驶舱</p>
        </div>
      </Link>
      <nav className="space-y-6">
        {sidebarMenu.map((section) => (
          <SidebarLink key={section.title} item={section} pathname={pathname} />
        ))}
      </nav>
    </aside>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <header className="flex flex-col gap-4 border-b border-divider bg-background/80 px-4 py-3 backdrop-blur lg:flex-row lg:items-center lg:gap-6">
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="lg:hidden"
            onPress={() => setMobileSidebarOpen((prev) => !prev)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-base font-semibold text-foreground">
            智创电商营销系统
          </span>
        </div>
        <div className="hidden flex-1 items-center gap-3 lg:flex">
          <div className="relative w-full max-w-md">
            <SearchFieldGroup>
              <SearchField.SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-default-400" />
              <SearchField.Input
                type="search"
                placeholder="搜索功能..."
                className="h-10 w-full rounded-full border border-default-200 bg-default-100 pl-11 pr-4 text-sm focus:border-primary focus:bg-default-200 focus:outline-none text-foreground placeholder:text-default-400"
              />
            </SearchFieldGroup>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitcher />
          <Button isIconOnly variant="light" radius="full">
            <Bell className="h-5 w-5 text-slate-500" />
          </Button>
          <Avatar size="sm" className="border border-slate-200">
            <AvatarImage alt="user-avatar" src="/images/user-avatar.jpg" />
          </Avatar>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-4 py-6 lg:px-6">
        <div className="hidden w-64 lg:block">
          <Sidebar pathname={pathname} />
        </div>

        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="w-72 bg-slate-900/90 p-6 backdrop-blur">
              <Sidebar pathname={pathname} />
            </div>
            <div
              className="flex-1 bg-black/40"
              onClick={() => setMobileSidebarOpen(false)}
            />
          </div>
        )}

        <main className="flex-1 rounded-2xl bg-content1 p-6 shadow-sm ring-1 ring-divider">
          {children}
        </main>
      </div>

      <footer className="pb-6 text-center text-sm text-default-500">
        © {new Date().getFullYear()} 智创电商营销系统 · Powered by AIGC 团队
      </footer>
    </div>
  );
}
