import dayjs from 'dayjs'
import { http } from '@/http/http'
import type { ITransactionItem, ITransactionForm } from './types/transaction'

/** 将月份字符串（YYYY-MM）转为后端所需的 startDate / endDate 区间 */
export function monthToDateRange(month: string): { startDate: string, endDate: string } {
  const d = dayjs(month, 'YYYY-MM')
  return {
    startDate: d.startOf('month').format('YYYY-MM-DD'),
    endDate: d.endOf('month').format('YYYY-MM-DD'),
  }
}

/** 获取指定月份的流水列表（按月度区间向后端查询） */
export function getTransactionList(startDate: string, endDate:string): Promise<ITransactionItem[]> {
  return http.get<ITransactionItem[]>('/api/transactions', {startDate, endDate})
}

/**
 * 创建收支记录（统一接口，通过 direction 决定金额正负）
 * @param form 表单数据
 * @param direction 'income' 金额取正，'expense' 金额取负
 */
export function createTransaction(form: ITransactionForm, direction: 'income' | 'expense'): Promise<{ id: number }> {
  const payload: Record<string, unknown> = {
    amount: direction === 'income' ? Math.abs(form.amount) : -Math.abs(form.amount),
    type: form.type,
    date: form.date,
    note: form.notes,
    counterparty: form.counterparty,
    product: form.product,
  }
  // 关联 id：仅在已选择时透传
  if (form.customer_id != null)
    payload.customer_id = form.customer_id
  if (form.product_id != null)
    payload.product_id = form.product_id
  return http.post<{ id: number }>('/api/transactions', payload)
}
