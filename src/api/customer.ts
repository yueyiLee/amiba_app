import { http } from '@/http/http'
import {
  type ICustomer,
  type ICustomerForm,
  joinContact,
} from './types/customer'

/** 拉取当前用户全部客户（用于列表渲染 + 本地搜索过滤） */
export function getCustomers(): Promise<ICustomer[]> {
  return http.get<ICustomer[]>('/api/customers')
}

/** 客户汇总：应收金额 + 最近交易日期（通过合同/交易关联表计算） */
export interface ICustomerSummary {
  id: number
  receivable: number
  last_transaction_date: string
}

export function getCustomerSummary(): Promise<ICustomerSummary[]> {
  return http.get<ICustomerSummary[]>('/api/customers/summary')
}

interface ICustomerPayload {
  name: string
  type: string
  contact: string
  address: string
  notes?: string
}

function toPayload(form: ICustomerForm): ICustomerPayload {
  return {
    name: form.name.trim(),
    type: form.type,
    contact: joinContact(form.contactName, form.phone),
    address: form.address.trim(),
    notes: form.notes,
  }
}

export function createCustomer(form: ICustomerForm): Promise<{ id: number }> {
  return http.post<{ id: number }>('/api/customers', toPayload(form))
}

export function updateCustomer(id: number, form: ICustomerForm): Promise<{ updated: boolean }> {
  return http.put<{ updated: boolean }>(`/api/customers/${id}`, toPayload(form))
}

export function deleteCustomer(id: number): Promise<{ deleted: boolean }> {
  return http.delete<{ deleted: boolean }>(`/api/customers/${id}`)
}
