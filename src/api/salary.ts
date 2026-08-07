import { http } from '@/http/http'

/** 工资记录 */
export interface ISalary {
  id: number
  employeeId: number
  employeeName?: string
  amount: number
  month: string
  ownerId: number
}

/** 工资提交数据 */
export interface ISalaryPayload {
  employee_id?: number
  amount?: number
  month?: string
}

// ========== 工资 CRUD ==========

/** 获取工资列表 */
export function getSalaries(): Promise<ISalary[]> {
  return http.get<ISalary[]>('/api/salaries')
}

/** 新增工资记录 */
export function createSalary(data: ISalaryPayload): Promise<{ id: number }> {
  return http.post<{ id: number }>('/api/salaries', data as unknown as Record<string, any>)
}

/** 删除工资记录 */
export function deleteSalary(id: number): Promise<{ success: boolean }> {
  return http.delete<{ success: boolean }>(`/api/salaries/${id}`)
}
