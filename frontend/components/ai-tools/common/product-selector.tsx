'use client'

import {
  Button,
  Card,
  Label,
  ListBox,
  Select,
  Spinner,
} from '@heroui/react'
import { FolderTree, ImageIcon, Package2, Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { Product } from './types'

interface ProductSelectorProps {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  products: Product[]
  selectedProduct: Product | null
  onProductChange: (productId: string | null) => void
  onGenerate: () => void
  canGenerate: boolean
  isGenerating: boolean
  isLoadingCategories?: boolean
  isLoadingProducts?: boolean
  isLoadingRuntimeConfig?: boolean
  previewImageUrl?: string | null
  previewPlaceholder?: string
  generateDisabledReason?: string
  showPreview?: boolean
  title?: string
  description?: string
  previewTitle?: string
  buttonLabel?: string
}

function renderLoadingText(
  isLoading: boolean | undefined,
  emptyText: string
): string {
  return isLoading ? '加载中...' : emptyText
}

export function ProductSelector({
  categories,
  selectedCategory,
  onCategoryChange,
  products,
  selectedProduct,
  onProductChange,
  onGenerate,
  canGenerate,
  isGenerating,
  isLoadingCategories = false,
  isLoadingProducts = false,
  isLoadingRuntimeConfig = false,
  previewImageUrl = null,
  previewPlaceholder,
  generateDisabledReason,
  showPreview = true,
  title = '生成设置',
  description = '先完成商品筛选，再发起 AI 生成任务。',
  previewTitle = '商品主图预览',
  buttonLabel = '开始生成',
}: ProductSelectorProps) {
  const buttonHoverClass = cn(
    'transition-all duration-200',
    'hover:shadow-md hover:shadow-[#91C1FA]/20',
    'active:scale-[0.98]'
  )

  return (
    <Card className='rounded-xl border-0 bg-[#F8F8F8] shadow-none dark:bg-slate-900/90 dark:ring-1 dark:ring-white/10'>
      <Card.Header className='border-b border-gray-200 px-5 py-4 dark:border-slate-700'>
        <div>
          <Card.Title className='text-base font-semibold text-gray-800 dark:text-slate-100'>
            {title}
          </Card.Title>
          <Card.Description className='mt-1 text-sm text-gray-500 dark:text-slate-400'>
            {description}
          </Card.Description>
        </div>
      </Card.Header>
      <Card.Content className='space-y-5 p-5'>
        <div className='grid gap-4 xl:grid-cols-2'>
          <Select
            className='w-full'
            isDisabled={isGenerating || isLoadingCategories}
            placeholder={renderLoadingText(isLoadingCategories, '选择分类')}
            selectedKey={selectedCategory || null}
            onSelectionChange={(key) =>
              onCategoryChange(key ? key.toString() : '')
            }
          >
            <Label className='mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300'>
              商品分类
            </Label>
            <Select.Trigger className='h-11 rounded-lg border-0 bg-[#F1F5F9] shadow-inner transition-all hover:shadow-md focus:ring-2 focus:ring-[#91C1FA]/30 dark:bg-slate-800 dark:shadow-none'>
              <FolderTree className='h-4 w-4 text-gray-400 dark:text-slate-500' />
              <Select.Value />
              {isLoadingCategories ? (
                <Spinner color='accent' size='sm' />
              ) : (
                <Select.Indicator />
              )}
            </Select.Trigger>
            <Select.Popover className='rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900'>
              <ListBox className='max-h-60 overflow-auto py-1'>
                {categories.map((category) => (
                  <ListBox.Item
                    className='cursor-pointer rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors hover:bg-[#91C1FA]/10 hover:text-[#91C1FA] data-[selected=true]:bg-[#91C1FA]/20 data-[selected=true]:font-medium data-[selected=true]:text-[#91C1FA] dark:text-slate-200 dark:hover:bg-sky-950/50 dark:data-[selected=true]:bg-sky-950/60'
                    id={category}
                    key={category}
                    textValue={category}
                  >
                    {category}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            className='w-full'
            isDisabled={!selectedCategory || isGenerating || isLoadingProducts}
            placeholder={renderLoadingText(
              isLoadingProducts,
              selectedCategory ? '选择商品' : '请先选择分类'
            )}
            selectedKey={selectedProduct?.product_id ?? null}
            onSelectionChange={(key) =>
              onProductChange(key ? key.toString() : null)
            }
          >
            <Label className='mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300'>
              商品选择
            </Label>
            <Select.Trigger className='h-11 rounded-lg border-0 bg-[#F1F5F9] shadow-inner transition-all hover:shadow-md focus:ring-2 focus:ring-[#91C1FA]/30 dark:bg-slate-800 dark:shadow-none'>
              <Package2 className='h-4 w-4 text-gray-400 dark:text-slate-500' />
              <Select.Value />
              {isLoadingProducts ? (
                <Spinner color='accent' size='sm' />
              ) : (
                <Select.Indicator />
              )}
            </Select.Trigger>
            <Select.Popover className='rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900'>
              <ListBox className='max-h-60 overflow-auto py-1'>
                {products.map((product) => (
                  <ListBox.Item
                    className='cursor-pointer rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none transition-colors hover:bg-[#91C1FA]/10 hover:text-[#91C1FA] data-[selected=true]:bg-[#91C1FA]/20 data-[selected=true]:font-medium data-[selected=true]:text-[#91C1FA] dark:text-slate-200 dark:hover:bg-sky-950/50 dark:data-[selected=true]:bg-sky-950/60'
                    id={product.product_id}
                    key={product.product_id}
                    textValue={product.name}
                  >
                    {product.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {showPreview ? (
          <div className='rounded-xl bg-white p-4 shadow-[inset_2px_2px_5px_rgba(203,213,225,0.6),inset_4px_4px_10px_rgba(203,213,225,0.3),inset_-2px_-2px_6px_rgba(255,255,255,0.9)] dark:bg-slate-800/60 dark:shadow-[inset_2px_2px_8px_rgba(0,0,0,0.35)]'>
            <div className='mb-3 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-200'>
              <ImageIcon className='h-4 w-4 text-[#91C1FA]' />
              {previewTitle}
            </div>
            <div className='flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-[#F8F8F8] p-3 dark:border-slate-600 dark:bg-slate-900/80'>
              {previewImageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={selectedProduct?.name ?? '商品主图'}
                    className='max-h-40 max-w-full rounded-lg object-contain'
                    loading='lazy'
                    src={previewImageUrl}
                  />
                </>
              ) : (
                <p className='text-center text-sm leading-6 text-gray-400 dark:text-slate-500'>
                  {previewPlaceholder ?? '选择商品后，这里会显示主图预览。'}
                </p>
              )}
            </div>
          </div>
        ) : null}

        <div className='space-y-3'>
          {generateDisabledReason ? (
            <p className='rounded-xl bg-white px-4 py-3 text-sm text-gray-500 shadow-sm dark:bg-slate-800/80 dark:text-slate-400'>
              {isLoadingRuntimeConfig
                ? '正在准备图片配置，稍后即可发起生成。'
                : generateDisabledReason}
            </p>
          ) : null}

          <Button
            className={cn(
              buttonHoverClass,
              'group relative h-12 w-full overflow-hidden rounded-xl font-medium text-white transition-all duration-300',
              'bg-[#91C1FA] hover:bg-[#7AB8FA] hover:shadow-lg hover:shadow-[#91C1FA]/30',
              'active:scale-[0.98] active:shadow-md',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none'
            )}
            isDisabled={!canGenerate || isGenerating}
            isPending={isGenerating}
            onPress={onGenerate}
          >
            <span className='relative z-10 flex items-center justify-center gap-2'>
              {isGenerating ? (
                <>
                  <Spinner className='text-white' color='current' size='sm' />
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <Sparkles className='h-4 w-4 transition-transform duration-300 group-hover:rotate-12' />
                  <span>{buttonLabel}</span>
                </>
              )}
            </span>
            <span
              aria-hidden='true'
              className='absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full'
            />
          </Button>
        </div>
      </Card.Content>
    </Card>
  )
}
