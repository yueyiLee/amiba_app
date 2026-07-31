/** 商品列表/详情返回结构（后端 products 表 + inventory 库存） */
export interface IProduct {
  id: number
  name: string
  /** 品牌，与 unit 组合为「规格」展示 */
  brand: string
  /** 单位，如 件 / 台 / 套 */
  unit: string
  category1: string
  category2: string
  purchase_price: number
  sale_price: number
  /** 备注（扩展字段） */
  notes?: string
  /** 库存预警阈值（扩展字段，库存 <= 阈值时预警） */
  warning_threshold?: number
  /** 当前库存（来自 inventory 表，列表展示用） */
  stock?: number
  created_at?: string
}

/** 商品表单提交数据 */
export interface IProductForm {
  id?: number
  name: string
  brand: string
  unit: string
  /** 采购价（元） */
  purchase_price: number | string
  /** 销售价（元，必填） */
  sale_price: number | string
  /** 初始库存（新建时写入 inventory） */
  initial_stock?: number | string
  notes: string
  warning_threshold?: number | string
}

/** 计算毛利率（百分比，保留 1 位小数） */
export function calcGrossMargin(purchase: number, sale: number): string {
  const p = Number(purchase) || 0
  const s = Number(sale) || 0
  if (s <= 0)
    return '0.0'
  const margin = ((s - p) / s) * 100
  return margin.toFixed(1)
}

/** 拼接规格展示文案：品牌 / 单位 */
export function formatSpec(brand?: string, unit?: string): string {
  const b = (brand || '').trim()
  const u = (unit || '').trim()
  if (b && u)
    return `${b} / ${u}`
  return b || u || '—'
}
