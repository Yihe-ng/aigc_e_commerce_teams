import { Suspense } from "react"

import ProductManagementContent from "@/components/products/basic/product-management-content"

export default function ProductBasicLibraryPage() {
  return (
    <div className="p-4 md:p-6">
      <Suspense fallback={<div className="min-h-[320px] rounded-3xl bg-default-100/60" />}>
        <ProductManagementContent />
      </Suspense>
    </div>
  )
}
