import dynamic from "next/dynamic"

const ProductManagementContent = dynamic(
  () => import("@/components/products/basic/product-management-content"),
  {
    loading: () => (
      <div className="space-y-4 p-4 md:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }
)

export default function ProductBasicLibraryPage() {
  return (
    <div className="p-4 md:p-6">
      <ProductManagementContent />
    </div>
  )
}
