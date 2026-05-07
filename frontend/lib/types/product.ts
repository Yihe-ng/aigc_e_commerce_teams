export interface SizeChartRow {
  尺码: string
  胸围: number | ""
  腰围: number | ""
  臀围: number | ""
  肩宽: number | ""
  袖长: number | ""
  衣长: number | ""
  建议体重: string
}

export interface Product {
  id: string | number
  name: string
  category: string
  price: number | string
  features: string[] | string
  description?: string
  images?: string[]
  main_image?: string
  sizes?: string[]
  size_chart?: Record<string, SizeChartRow>
  colors?: string[]
  fit?: string
  fabric?: string
  style?: string
  scene?: string[]
  tags?: string[]
}

export interface Category {
  key: string
  label: string
}

export interface ProductFormValue {
  name: string
  category: string
  price: string
  features: string
  description: string
  sizes: string[]
  size_chart: SizeChartRow[]
  colors: string[]
  fit: string
  fabric: string
  style: string
  scene: string[]
  tags: string[]
}
