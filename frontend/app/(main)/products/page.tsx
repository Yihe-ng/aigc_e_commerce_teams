import { redirect } from "next/navigation"

/** 无独立「商品管理」页，统一进入基础信息库 */
export default function ProductsIndexPage() {
  redirect("/products/basic")
}
