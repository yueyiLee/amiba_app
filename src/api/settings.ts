import { http } from '@/http/http'
import type { IUserSettings, IExpenseTypeForm, IExpenseTypeUpdate, IExpenseItemForm, IUpdateSettingsPayload } from './types/settings'
import type { IExpenseType, IExpenseItem } from './types/transaction'

/* ==================== 用户设置 ==================== */

/** 获取当前用户所有设置 */
export function getSettings(): Promise<IUserSettings> {
  return http.get<IUserSettings>('/api/settings')
}

/** 批量更新用户设置（upsert） */
export function updateSettings(data: IUpdateSettingsPayload): Promise<{ success: boolean }> {
  return http.put<{ success: boolean }>('/api/settings', data as Record<string, unknown>)
}

/* ==================== 收支类型 CRUD ==================== */

/** 获取所有收支类型（含未启用，用于设置页管理） */
export function getAllExpenseTypes(direction?: 'income' | 'expense'): Promise<IExpenseType[]> {
  const query: Record<string, string> = {}
  if (direction) query.direction = direction
  return http.get<IExpenseType[]>('/api/expense-types', query)
}

/** 创建收支类型 */
export function createExpenseType(data: IExpenseTypeForm): Promise<{ id: number }> {
  return http.post<{ id: number }>('/api/expense-types', data as Record<string, unknown>)
}

/** 更新收支类型 */
export function updateExpenseType(id: number, data: IExpenseTypeUpdate): Promise<{ success: boolean }> {
  return http.put<{ success: boolean }>(`/api/expense-types/${id}`, data as Record<string, unknown>)
}

/** 删除收支类型 */
export function deleteExpenseType(id: number): Promise<{ success: boolean }> {
  return http.delete<{ success: boolean }>(`/api/expense-types/${id}`)
}

/* ==================== 杂费类别 CRUD ==================== */

/** 创建杂费类别 */
export function createExpenseItem(data: IExpenseItemForm): Promise<{ id: number }> {
  return http.post<{ id: number }>('/api/expense-items', data as Record<string, unknown>)
}

/** 更新杂费类别 */
export function updateExpenseItem(id: number, data: { name: string; note: string }): Promise<{ success: boolean }> {
  return http.put<{ success: boolean }>(`/api/expense-items/${id}`, data as Record<string, unknown>)
}

/** 删除杂费类别 */
export function deleteExpenseItem(id: number): Promise<{ success: boolean }> {
  return http.delete<{ success: boolean }>(`/api/expense-items/${id}`)
}
