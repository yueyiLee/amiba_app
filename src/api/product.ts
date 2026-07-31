import { http } from '@/http/http'
import { type IProduct, type IProductForm } from './types/product'

/** 拉取当前用户全部商品（库存通过 inventory 关联返回） */
export function getProducts(): Promise<IProduct[]> {
  return http.get<IProduct[]>('/api/products')
}

interface IProductPayload {
  name: string
  brand: string
  unit: string
  category1: string
  category2: string
  purchase_price: number
  sale_price: number
  notes?: string
  warning_threshold?: number
  initial_stock?: number
}

function toPayload(form: IProductForm): IProductPayload {
  return {
    name: form.name.trim(),
    brand: form.brand.trim(),
    unit: form.unit.trim() || '件',
    // 一级分类复用品牌字段；详见后端 products.category1
    category1: form.brand.trim() || '未分类',
    category2: '',
    purchase_price: Number(form.purchase_price) || 0,
    sale_price: Number(form.sale_price) || 0,
    notes: form.notes,
    warning_threshold: Number(form.warning_threshold) || 0,
    initial_stock: Number(form.initial_stock) || 0,
  }
}

export function createProduct(form: IProductForm): Promise<{ id: number }> {
  return http.post<{ id: number }>('/api/products', toPayload(form))
}

export function updateProduct(id: number, form: IProductForm): Promise<{ updated: boolean }> {
  return http.put<{ updated: boolean }>(`/api/products/${id}`, toPayload(form))
}

export function deleteProduct(id: number): Promise<{ deleted: boolean }> {
  return http.delete<{ deleted: boolean }>(`/api/products/${id}`)
}
