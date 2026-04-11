interface ProductHeaderProps {
  autoSaveMsg: string
}

export default function ProductHeader({ autoSaveMsg }: ProductHeaderProps) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">商品基础信息库</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
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
