interface ProductHeaderProps {
  autoSaveMsg: string
}

export default function ProductHeader({ autoSaveMsg }: ProductHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200/70 pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">商品基础信息库</h1>
        <p className="mt-2 text-sm text-slate-500">
          在这里维护将用于 AIGC 工作流的商品基础资料、特点与图像素材。
        </p>
      </div>

      {autoSaveMsg ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {autoSaveMsg}
        </span>
      ) : null}
    </div>
  )
}
