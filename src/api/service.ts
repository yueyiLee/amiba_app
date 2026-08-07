import { http } from '@/http/http'
import type { IService, IServiceForm } from './types/service'

/** 拉取当前用户全部服务（支持名称模糊搜索） */
export function getServices(search?: string): Promise<IService[]> {
  return http.get<IService[]>('/api/services', search ? { q: search } : undefined)
}

/** 创建服务 */
export function createService(form: IServiceForm): Promise<{ id: number }> {
  return http.post<{ id: number }>('/api/services', {
    name: form.name.trim(),
    reference_cost: Number(form.reference_cost) || 0,
    note: form.note,
  })
}

/** 更新服务 */
export function updateService(id: number, form: IServiceForm): Promise<{ success: boolean }> {
  return http.put<{ success: boolean }>(`/api/services/${id}`, {
    name: form.name.trim(),
    reference_cost: Number(form.reference_cost) || 0,
    note: form.note,
  })
}

/** 删除服务 */
export function deleteService(id: number): Promise<{ success: boolean }> {
  return http.delete<{ success: boolean }>(`/api/services/${id}`)
}
