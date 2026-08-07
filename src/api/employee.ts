import { http } from '@/http/http'

/** 员工列表项 */
export interface IEmployee {
  id: number
  name: string
  position: string
  hourlyRate: number
  joinDate: string
  status: 'active' | 'left'
  leaveDate: string
  ownerId: number
  createdAt: string
}

/** 员工表单提交数据 */
export interface IEmployeePayload {
  name: string
  hourly_rate: number
  position?: string
  join_date?: string
  status?: string
  leave_date?: string
}

/** 状态变更请求 */
export interface IStatusChangePayload {
  status: 'active' | 'left'
  leave_date?: string
  note?: string
  position?: string
  hourly_rate?: number
  changed_date?: string
}

/** 状态变更历史记录 */
export interface IStatusHistory {
  id: number
  employeeId: number
  employeeName?: string
  status: string
  changeType: string
  position: string
  hourlyRate: number
  changedDate: string
  note: string
  ownerId: number
  createdAt: string
}

// ========== 员工 CRUD ==========

/** 获取员工列表 */
export function getEmployees(): Promise<IEmployee[]> {
  return http.get<IEmployee[]>('/api/employees')
}

/** 新增员工 */
export function createEmployee(data: IEmployeePayload): Promise<{ id: number }> {
  return http.post<{ id: number }>('/api/employees', data as unknown as Record<string, any>)
}

/** 编辑员工 */
export function updateEmployee(id: number, data: Partial<IEmployeePayload>): Promise<{ success: boolean }> {
  return http.put<{ success: boolean }>(`/api/employees/${id}`, data as unknown as Record<string, any>)
}

/** 删除员工 */
export function deleteEmployee(id: number): Promise<{ success: boolean }> {
  return http.delete<{ success: boolean }>(`/api/employees/${id}`)
}

// ========== 状态变更 ==========

/** 变更员工状态（入职/离职/复职） */
export function updateEmployeeStatus(id: number, data: IStatusChangePayload): Promise<{ success: boolean }> {
  return http.patch(`/api/employees/${id}/status`, data as unknown as Record<string, any>)
}

/** 获取某个员工的状态变更历史 */
export function getStatusHistory(employeeId: number): Promise<IStatusHistory[]> {
  return http.get<IStatusHistory[]>(`/api/employees/${employeeId}/status-history`)
}

/** 获取所有员工的状态变更历史 */
export function getAllStatusHistory(): Promise<IStatusHistory[]> {
  return http.get<IStatusHistory[]>('/api/employee-status-history-all')
}
