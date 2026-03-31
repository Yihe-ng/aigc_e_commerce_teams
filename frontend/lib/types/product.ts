export interface Product {
  id: string | number
  name: string
  category: string
  price: number | string
  features: string[] | string
  description?: string
  images?: string[]
  main_image?: string
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
}
