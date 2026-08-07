import { http } from '@/http/http'
import {
  type IInventory,
  type IInventoryCreatePayload,
  type IInventoryUpdatePayload,
} from './types/inventory'

/** 拉取当前用户全部库存（JOIN products 返回商品名/分类/单位等） */
export function getInventoryList(): Promise<IInventory[]> {
  return http.get<IInventory[]>('/api/inventory')
}

/** 新增库存（按商品 upsert：同一商品仅一条库存记录） */
export function createInventory(payload: IInventoryCreatePayload): Promise<{ id: number; updated?: boolean }> {
  return http.post<{ id: number; updated?: boolean }>('/api/inventory', payload)
}

/** 调整库存数量与均价 */
export function updateInventory(id: number, payload: IInventoryUpdatePayload): Promise<{ success: boolean }> {
  return http.put<{ success: boolean }>(`/api/inventory/${id}`, payload)
}

/** 删除库存记录 */
export function deleteInventory(id: number): Promise<{ success: boolean }> {
  return http.delete<{ success: boolean }>(`/api/inventory/${id}`)
}
