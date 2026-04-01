export interface MarketingAsset {
  url: string
}

export interface MarketingProduct {
  product_name: string
  marketing_text?: string
  posters?: MarketingAsset[]
  videos?: MarketingAsset[]
}
