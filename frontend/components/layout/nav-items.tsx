"use client"

import { Button, Dropdown, Label, Separator } from "@heroui/react"
import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

import {
  CUSTOMERS_GROUP_EXPANDED_KEY,
  CUSTOMERS_MENU_KEYS,
  CUSTOMERS_NAV,
  DASHBOARD_GROUP_EXPANDED_KEY,
  DASHBOARD_MENU_KEYS,
  DASHBOARD_NAV,
  NAV_BOTTOM,
  PRODUCT_GROUP_EXPANDED_KEY,
  PRODUCT_MENU_KEYS,
  PRODUCT_NAV,
  WORKSPACE_GROUP_EXPANDED_KEY,
  WORKSPACE_MENU_KEYS,
  WORKSPACE_NAV,
} from "./nav-config"

export function NavItems({
  onNavigate,
  pathname,
  collapsed,
}: {
  onNavigate?: () => void
  pathname: string | null
  collapsed: boolean
}) {
  const path = pathname ?? ""
  const router = useRouter()
  const ProductIcon = PRODUCT_NAV.icon
  const CustomersIcon = CUSTOMERS_NAV.icon

  const isNavActive = (href: string) =>
    path === href || (href !== "/home" && path.startsWith(href))

  const isWorkspaceChildActive = (href: string) =>
    path === href || path.startsWith(`${href}/`)

  const isProductChildActive = (href: string) =>
    path === href || path.startsWith(`${href}/`)

  const isOnWorkspaceChild =
    path.startsWith("/ai-tools/") || path.startsWith("/workspace/")
  const isOnProductChild =
    path.startsWith("/products/basic") || path.startsWith("/products/marketing")
  const isOnCustomersChild = path.startsWith("/customers")
  const isOnDashboardChild = path.startsWith("/dashboard/analytics")

  const isAnyWorkspaceRoute = isOnWorkspaceChild
  const isAnyProductRoute = isOnProductChild
  const isAnyCustomersRoute = isOnCustomersChild
  const isAnyDashboardRoute = isOnDashboardChild

  const isCustomersChildActive = (href: string) => {
    if (href === "/customers") {
      return path === "/customers" || path === "/customers/"
    }
    return path === href || path.startsWith(`${href}/`)
  }

  /** 与 SSR 首帧保持一致，避免 localStorage 仅在客户端可读导致 hydration mismatch */
  const [workspaceGroupOpen, setWorkspaceGroupOpen] = useState(true)
  const [productGroupOpen, setProductGroupOpen] = useState(true)
  const [customersGroupOpen, setCustomersGroupOpen] = useState(true)
  const [dashboardGroupOpen, setDashboardGroupOpen] = useState(true)

  useEffect(() => {
    try {
      if (localStorage.getItem(WORKSPACE_GROUP_EXPANDED_KEY) === "0") {
        setWorkspaceGroupOpen(false)
      }
      if (localStorage.getItem(PRODUCT_GROUP_EXPANDED_KEY) === "0") {
        setProductGroupOpen(false)
      }
      if (localStorage.getItem(CUSTOMERS_GROUP_EXPANDED_KEY) === "0") {
        setCustomersGroupOpen(false)
      }
      if (localStorage.getItem(DASHBOARD_GROUP_EXPANDED_KEY) === "0") {
        setDashboardGroupOpen(false)
      }
    } catch {
      /* ignore */
    }
  }, [])

  /** 进入任一工作台子页时自动展开分组 */
  useEffect(() => {
    if (isOnWorkspaceChild) setWorkspaceGroupOpen(true)
  }, [isOnWorkspaceChild])

  /** 进入任一商品子页时自动展开分组 */
  useEffect(() => {
    if (isOnProductChild) setProductGroupOpen(true)
  }, [isOnProductChild])

  /** 进入任一客户与营销子页时自动展开分组 */
  useEffect(() => {
    if (isOnCustomersChild) setCustomersGroupOpen(true)
  }, [isOnCustomersChild])

  useEffect(() => {
    if (isOnDashboardChild) setDashboardGroupOpen(true)
  }, [isOnDashboardChild])

  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACE_GROUP_EXPANDED_KEY, workspaceGroupOpen ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [workspaceGroupOpen])

  useEffect(() => {
    try {
      localStorage.setItem(PRODUCT_GROUP_EXPANDED_KEY, productGroupOpen ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [productGroupOpen])

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMERS_GROUP_EXPANDED_KEY, customersGroupOpen ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [customersGroupOpen])

  useEffect(() => {
    try {
      localStorage.setItem(DASHBOARD_GROUP_EXPANDED_KEY, dashboardGroupOpen ? "1" : "0")
    } catch {
      /* ignore */
    }
  }, [dashboardGroupOpen])

  /** 与「首页」等 Link 一致：只过渡颜色相关属性，避免 Button 默认的 transform/opacity 与 Link 不同步 */
  const navTransitionClass =
    "transition-[color,background-color,border-color] duration-200 ease-out motion-reduce:transition-none"

  /** 折叠态（md+）：全宽 h-11 + 与 Link 相同的 hover/active，对齐「首页」单行入口 */
  const collapsedGroupTriggerClass = (active: boolean) =>
    cn(
      navTransitionClass,
      "flex h-11 min-h-11 w-full max-w-full shrink-0 items-center justify-center rounded-xl border-0 bg-transparent px-2 text-sm font-medium shadow-none outline-none",
      active
        ? "bg-foreground/10 text-foreground"
        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground data-[hovered]:bg-foreground/5 data-[hovered]:text-foreground",
    )

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none",
      navTransitionClass,
      isNavActive(href)
        ? "bg-foreground/10 text-foreground"
        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
      collapsed && "md:justify-center md:gap-0 md:px-2 md:py-2.5",
    )

  const workspaceSubLinkClass = (href: string) =>
    cn(
      "flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-2 text-[13px] font-medium outline-none",
      navTransitionClass,
      isWorkspaceChildActive(href)
        ? "bg-foreground/10 text-foreground"
        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
    )

  const productSubLinkClass = (href: string) =>
    cn(
      "flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-2 text-[13px] font-medium outline-none",
      navTransitionClass,
      isProductChildActive(href)
        ? "bg-foreground/10 text-foreground"
        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
    )

  const customersSubLinkClass = (href: string) =>
    cn(
      "flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-2 text-[13px] font-medium outline-none",
      navTransitionClass,
      isCustomersChildActive(href)
        ? "bg-foreground/10 text-foreground"
        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
    )

  const workspaceParentButtonClass = cn(
    navTransitionClass,
    "h-auto min-h-11 w-full justify-start gap-2 rounded-xl px-2 py-2.5 text-sm font-medium",
    isAnyWorkspaceRoute
      ? "bg-foreground/10 text-foreground"
      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
  )

  const parentButtonClass = cn(
    navTransitionClass,
    "h-auto min-h-11 w-full justify-start gap-2 rounded-xl px-2 py-2.5 text-sm font-medium",
    isAnyProductRoute
      ? "bg-foreground/10 text-foreground"
      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
  )

  const customersParentButtonClass = cn(
    navTransitionClass,
    "h-auto min-h-11 w-full justify-start gap-2 rounded-xl px-2 py-2.5 text-sm font-medium",
    isAnyCustomersRoute
      ? "bg-foreground/10 text-foreground"
      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
  )

  const dashboardParentButtonClass = cn(
    navTransitionClass,
    "h-auto min-h-11 w-full justify-start gap-2 rounded-xl px-2 py-2.5 text-sm font-medium",
    isAnyDashboardRoute
      ? "bg-foreground/10 text-foreground"
      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
  )

  const isDashboardChildActive = (href: string) => path === href || path.startsWith(`${href}/`)

  const dashboardSubLinkClass = (href: string) =>
    cn(
      "flex items-center gap-2.5 rounded-lg py-2 pl-3 pr-2 text-[13px] font-medium outline-none",
      navTransitionClass,
      isDashboardChildActive(href)
        ? "bg-foreground/10 text-foreground"
        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
    )

  const onWorkspaceMenuAction = (key: string | number) => {
    const map: Record<string, string> = {
      [WORKSPACE_MENU_KEYS.copywriting]: "/ai-tools/textgenerate",
      [WORKSPACE_MENU_KEYS.marketingImages]: "/ai-tools/image",
      [WORKSPACE_MENU_KEYS.shortVideo]: "/ai-tools/video",
    }
    const href = map[String(key)]
    if (href) {
      onNavigate?.()
      router.push(href)
    }
  }

  const onProductMenuAction = (key: string | number) => {
    const map: Record<string, string> = {
      [PRODUCT_MENU_KEYS.basic]: "/products/basic",
      [PRODUCT_MENU_KEYS.marketing]: "/products/marketing",
    }
    const href = map[String(key)]
    if (href) {
      onNavigate?.()
      router.push(href)
    }
  }

  const onCustomersMenuAction = (key: string | number) => {
    const map: Record<string, string> = {
      [CUSTOMERS_MENU_KEYS.overview]: "/customers",
      [CUSTOMERS_MENU_KEYS.marketingSchedule]: "/customers/marketing-schedule",
      [CUSTOMERS_MENU_KEYS.marketingNotes]: "/customers/marketing-notes",
    }
    const href = map[String(key)]
    if (href) {
      onNavigate?.()
      router.push(href)
    }
  }

  const onDashboardMenuAction = (key: string | number) => {
    const map: Record<string, string> = {
      [DASHBOARD_MENU_KEYS.merchantSource]: "/dashboard/analytics/merchant-source",
      [DASHBOARD_MENU_KEYS.analyst]: "/dashboard/analytics/analyst",
      [DASHBOARD_MENU_KEYS.platform]: "/dashboard/analytics/platform",
    }
    const href = map[String(key)]
    if (href) {
      onNavigate?.()
      router.push(href)
    }
  }

  const DashboardIcon = DASHBOARD_NAV.icon

  return (
    <nav className={cn("flex flex-1 flex-col gap-1 px-3 py-4", collapsed && "md:px-1.5")}>
      <p
        className={cn(
          "mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase",
          collapsed && "md:hidden",
        )}
      >
        主导航
      </p>
      <Link
        href="/home"
        className={linkClass("/home")}
        title={collapsed ? "首页" : undefined}
        onClick={onNavigate}
      >
        <Home aria-hidden className="size-5 shrink-0 opacity-80" />
        <span className={cn(collapsed && "md:sr-only")}>首页</span>
      </Link>
      {/* 商品管理：可折叠子项；桌面窄侧栏用下拉 */}
      <div className="flex flex-col gap-1">
        <div className={cn(collapsed && "md:hidden")}>
          <Button
            type="button"
            variant="ghost"
            className={parentButtonClass}
            aria-expanded={productGroupOpen}
            aria-controls="product-nav-sub"
            onPress={() => setProductGroupOpen((o) => !o)}
          >
            <ChevronRight
              aria-hidden
              className={cn(
                "size-4 shrink-0 opacity-70 transition-transform duration-200",
                productGroupOpen && "rotate-90",
              )}
            />
            <ProductIcon aria-hidden className="size-5 shrink-0 opacity-80" />
            <span className={cn("min-w-0 flex-1 truncate text-left", collapsed && "md:sr-only")}>
              {PRODUCT_NAV.label}
            </span>
          </Button>
          {productGroupOpen ? (
            <div
              id="product-nav-sub"
              className="mt-1 ml-2 flex flex-col gap-0.5 border-l border-border pl-3"
            >
              {PRODUCT_NAV.children.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={productSubLinkClass(href)}
                  title={collapsed ? label : undefined}
                  onClick={onNavigate}
                >
                  <Icon aria-hidden className="size-4 shrink-0 opacity-80" />
                  <span className={cn(collapsed && "md:sr-only")}>{label}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className={cn("hidden w-full", collapsed && "md:block")}>
          <Dropdown>
            <Button
              variant="ghost"
              aria-label={PRODUCT_NAV.label}
              aria-haspopup="menu"
              className={collapsedGroupTriggerClass(isAnyProductRoute)}
            >
              <ProductIcon aria-hidden className="size-5 shrink-0 opacity-80" />
            </Button>
            <Dropdown.Popover className="min-w-[220px]">
              <Dropdown.Menu onAction={onProductMenuAction}>
                {PRODUCT_NAV.children.map(({ href, label, icon: Icon }) => (
                  <Dropdown.Item
                    key={href}
                    id={href.endsWith("/basic") ? PRODUCT_MENU_KEYS.basic : PRODUCT_MENU_KEYS.marketing}
                    textValue={label}
                  >
                    <div className="flex items-center gap-2">
                      <Icon aria-hidden className="size-4 opacity-80" />
                      <Label>{label}</Label>
                    </div>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>
      {/* 工作台：可折叠子项；桌面窄侧栏用下拉 */}
      <div className="flex flex-col gap-1">
        <div className={cn(collapsed && "md:hidden")}>
          <Button
            type="button"
            variant="ghost"
            className={workspaceParentButtonClass}
            aria-expanded={workspaceGroupOpen}
            aria-controls="workspace-nav-sub"
            onPress={() => setWorkspaceGroupOpen((o) => !o)}
          >
            <ChevronRight
              aria-hidden
              className={cn(
                "size-4 shrink-0 opacity-70 transition-transform duration-200",
                workspaceGroupOpen && "rotate-90",
              )}
            />
            <WORKSPACE_NAV.icon aria-hidden className="size-5 shrink-0 opacity-80" />
            <span className={cn("min-w-0 flex-1 truncate text-left", collapsed && "md:sr-only")}>
              {WORKSPACE_NAV.label}
            </span>
          </Button>
          {workspaceGroupOpen ? (
            <div
              id="workspace-nav-sub"
              className="mt-1 ml-2 flex flex-col gap-0.5 border-l border-border pl-3"
            >
              {WORKSPACE_NAV.children.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={workspaceSubLinkClass(href)}
                  title={collapsed ? label : undefined}
                  onClick={onNavigate}
                >
                  <Icon aria-hidden className="size-4 shrink-0 opacity-80" />
                  <span className={cn(collapsed && "md:sr-only")}>{label}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className={cn("hidden w-full", collapsed && "md:block")}>
          <Dropdown>
            <Button
              variant="ghost"
              aria-label={WORKSPACE_NAV.label}
              aria-haspopup="menu"
              className={collapsedGroupTriggerClass(isAnyWorkspaceRoute)}
            >
              <WORKSPACE_NAV.icon aria-hidden className="size-5 shrink-0 opacity-80" />
            </Button>
            <Dropdown.Popover className="min-w-[220px]">
              <Dropdown.Menu onAction={onWorkspaceMenuAction}>
                {WORKSPACE_NAV.children.map(({ href, label, icon: Icon }) => (
                  <Dropdown.Item
                    key={href}
                    id={
                      href.endsWith("/textgenerate")
                        ? WORKSPACE_MENU_KEYS.copywriting
                        : href.endsWith("/image")
                          ? WORKSPACE_MENU_KEYS.marketingImages
                          : WORKSPACE_MENU_KEYS.shortVideo
                    }
                    textValue={label}
                  >
                    <div className="flex items-center gap-2">
                      <Icon aria-hidden className="size-4 opacity-80" />
                      <Label>{label}</Label>
                    </div>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      {/* 数据概览：三个子页面 */}
      <div className="flex flex-col gap-1">
        <div className={cn(collapsed && "md:hidden")}>
          <Button
            type="button"
            variant="ghost"
            className={dashboardParentButtonClass}
            aria-expanded={dashboardGroupOpen}
            aria-controls="dashboard-nav-sub"
            onPress={() => setDashboardGroupOpen((o) => !o)}
          >
            <ChevronRight
              aria-hidden
              className={cn(
                "size-4 shrink-0 opacity-70 transition-transform duration-200",
                dashboardGroupOpen && "rotate-90",
              )}
            />
            <DashboardIcon aria-hidden className="size-5 shrink-0 opacity-80" />
            <span className={cn("min-w-0 flex-1 truncate text-left", collapsed && "md:sr-only")}>
              {DASHBOARD_NAV.label}
            </span>
          </Button>
          {dashboardGroupOpen ? (
            <div
              id="dashboard-nav-sub"
              className="mt-1 ml-2 flex flex-col gap-0.5 border-l border-border pl-3"
            >
              {DASHBOARD_NAV.children.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={dashboardSubLinkClass(href)}
                  title={collapsed ? label : undefined}
                  onClick={onNavigate}
                >
                  <Icon aria-hidden className="size-4 shrink-0 opacity-80" />
                  <span className={cn(collapsed && "md:sr-only")}>{label}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className={cn("hidden w-full", collapsed && "md:block")}>
          <Dropdown>
            <Button
              variant="ghost"
              aria-label={DASHBOARD_NAV.label}
              aria-haspopup="menu"
              className={collapsedGroupTriggerClass(isAnyDashboardRoute)}
            >
              <DashboardIcon aria-hidden className="size-5 shrink-0 opacity-80" />
            </Button>
            <Dropdown.Popover className="min-w-[220px]">
              <Dropdown.Menu onAction={onDashboardMenuAction}>
                {DASHBOARD_NAV.children.map(({ href, label, icon: Icon }) => (
                  <Dropdown.Item
                    key={href}
                    id={
                      href.includes("merchant-source")
                        ? DASHBOARD_MENU_KEYS.merchantSource
                        : href.includes("/analyst")
                          ? DASHBOARD_MENU_KEYS.analyst
                          : DASHBOARD_MENU_KEYS.platform
                    }
                    textValue={label}
                  >
                    <div className="flex items-center gap-2">
                      <Icon aria-hidden className="size-4 opacity-80" />
                      <Label>{label}</Label>
                    </div>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      {/* 客户与营销：可折叠子项；桌面窄侧栏用下拉 */}
      <div className="flex flex-col gap-1">
        <div className={cn(collapsed && "md:hidden")}>
          <Button
            type="button"
            variant="ghost"
            className={customersParentButtonClass}
            aria-expanded={customersGroupOpen}
            aria-controls="customers-nav-sub"
            onPress={() => setCustomersGroupOpen((o) => !o)}
          >
            <ChevronRight
              aria-hidden
              className={cn(
                "size-4 shrink-0 opacity-70 transition-transform duration-200",
                customersGroupOpen && "rotate-90",
              )}
            />
            <CustomersIcon aria-hidden className="size-5 shrink-0 opacity-80" />
            <span className={cn("min-w-0 flex-1 truncate text-left", collapsed && "md:sr-only")}>
              {CUSTOMERS_NAV.label}
            </span>
          </Button>
          {customersGroupOpen ? (
            <div
              id="customers-nav-sub"
              className="mt-1 ml-2 flex flex-col gap-0.5 border-l border-border pl-3"
            >
              {CUSTOMERS_NAV.children.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={customersSubLinkClass(href)}
                  title={collapsed ? label : undefined}
                  onClick={onNavigate}
                >
                  <Icon aria-hidden className="size-4 shrink-0 opacity-80" />
                  <span className={cn(collapsed && "md:sr-only")}>{label}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className={cn("hidden w-full", collapsed && "md:block")}>
          <Dropdown>
            <Button
              variant="ghost"
              aria-label={CUSTOMERS_NAV.label}
              aria-haspopup="menu"
              className={collapsedGroupTriggerClass(isAnyCustomersRoute)}
            >
              <CustomersIcon aria-hidden className="size-5 shrink-0 opacity-80" />
            </Button>
            <Dropdown.Popover className="min-w-[220px]">
              <Dropdown.Menu onAction={onCustomersMenuAction}>
                {CUSTOMERS_NAV.children.map(({ href, label, icon: Icon }) => (
                  <Dropdown.Item
                    key={href}
                    id={
                      href === "/customers"
                        ? CUSTOMERS_MENU_KEYS.overview
                        : href.endsWith("/marketing-schedule")
                          ? CUSTOMERS_MENU_KEYS.marketingSchedule
                          : CUSTOMERS_MENU_KEYS.marketingNotes
                    }
                    textValue={label}
                  >
                    <div className="flex items-center gap-2">
                      <Icon aria-hidden className="size-4 opacity-80" />
                      <Label>{label}</Label>
                    </div>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      <Separator className={cn("my-3", collapsed && "md:mx-1")} />
      <p
        className={cn(
          "mb-2 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase",
          collapsed && "md:hidden",
        )}
      >
        快捷入口
      </p>
      {NAV_BOTTOM.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={linkClass(href)}
          title={collapsed ? label : undefined}
          onClick={onNavigate}
        >
          <Icon aria-hidden className="size-5 shrink-0 opacity-80" />
          <span className={cn(collapsed && "md:sr-only")}>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
