/** 库存列表/详情返回结构（后端 /api/inventory，JOIN products） */
export interface IInventory {
  id: number
  productId: number
  /** 商品名称 */
  productName: string
  category1: string
  category2?: string
  /** 单位（后端补充字段），如 件 / 台 / 套 */
  unit?: string
  /** 库存数量 */
  quantity: number
  /** 均价（元） */
  avgPrice: number
  purchasePrice?: number
  salePrice?: number
  /** 库存预警阈值（后端补充字段，库存 <= 阈值时预警） */
  warningThreshold?: number
  /** 最后编辑时间 */
  updatedAt?: string
}

/** 新增库存提交参数（POST /api/inventory） */
export interface IInventoryCreatePayload {
  product_id: number
  quantity: number
  avg_price?: number
}

/** 调整库存提交参数（PUT /api/inventory/:id） */
export interface IInventoryUpdatePayload {
  quantity: number
  avg_price?: number
}

/** 库存价值 = 数量 × 均价 */
export function calcInventoryValue(item: Pick<IInventory, 'quantity' | 'avgPrice'>): number {
  return (Number(item.quantity) || 0) * (Number(item.avgPrice) || 0)
}

/** 拼接分类文案：一级 / 二级 */
export function formatCategory(cat1?: string, cat2?: string): string {
  const a = (cat1 || '').trim()
  const b = (cat2 || '').trim()
  if (a && b)
    return `${a} › ${b}`
  return a || b || '未分类'
}

/** 是否命中库存预警：阈值 > 0 且 库存 <= 阈值（与商品列表 isWarning 一致） */
export function isInventoryWarning(item: Pick<IInventory, 'quantity' | 'warningThreshold'>): boolean {
  const threshold = item.warningThreshold ?? 0
  if (threshold <= 0)
    return false
  return (item.quantity ?? 0) <= threshold
}
