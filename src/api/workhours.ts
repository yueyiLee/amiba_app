import { http } from '@/http/http'

/** 工时记录（含 JOIN 的员工姓名和时薪） */
export interface IWorkHour {
  id: number
  employeeId: number
  employeeName?: string
  hourlyRate?: number
  hours: number
  month: string
  ownerId: number
}

/** 工时提交数据 */
export interface IWorkHourPayload {
  employee_id: number
  hours: number
  month: string
}

// ========== 工时 CRUD ==========

/** 获取工时列表（可选按月份筛选） */
export function getWorkHours(month?: string): Promise<IWorkHour[]> {
  return http.get<IWorkHour[]>('/api/workhours', month ? { month } : undefined)
}

/** 新增/更新工时（upsert：同人同月自动更新） */
export function upsertWorkHour(data: IWorkHourPayload): Promise<{ success: boolean }> {
  return http.post<{ success: boolean }>('/api/workhours', data as unknown as Record<string, any>)
}

/** 删除工时记录 */
export function deleteWorkHour(id: number): Promise<{ success: boolean }> {
  return http.delete<{ success: boolean }>(`/api/workhours/${id}`)
}
