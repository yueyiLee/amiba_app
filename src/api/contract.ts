import { http } from '@/http/http'
import type { ContractStatus, IContract, IContractDetail, IContractForm, IContractFormItem, IContractFormService } from './types/contract'

/**
 * 状态值中英映射：
 * 后端 contracts.status 存中文（'进行中'/'已完成' 等），
 * 前端统一使用英文枚举值（in_progress 等），在 API 边界转换，保证兼容存量数据。
 */
const STATUS_CN_TO_EN: Record<string, ContractStatus> = {
  进行中: 'in_progress',
  已完成: 'completed',
  已取消: 'cancelled',
}

const STATUS_EN_TO_CN: Record<ContractStatus, string> = {
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
}

/** 后端中文 → 前端英文（未知值原样返回） */
function normalizeStatus(status: string | undefined | null): ContractStatus {
  if (!status)
    return 'in_progress'
  return STATUS_CN_TO_EN[status] ?? (status as ContractStatus)
}

/** 前端英文 → 后端中文 */
function denormalizeStatus(status: ContractStatus): string {
  return STATUS_EN_TO_CN[status] ?? status
}

/** 拉取当前用户全部合同（含 items/services 明细），状态统一转为英文枚举 */
export async function getContracts(): Promise<IContract[]> {
  const list = await http.get<IContract[]>('/api/contracts')
  return list.map(c => ({
    ...c,
    status: normalizeStatus(c.status),
  }))
}

/** 获取单个合同详情（复用列表接口，前端按 id 过滤） */
export async function getContractById(id: number): Promise<IContractDetail> {
  const list = await getContracts()
  const found = list.find(c => c.id === id)
  if (!found)
    throw new Error('合同不存在或已被删除')
  return found as IContractDetail
}

/** 合同创建/更新请求体（对齐后端 POST /api/contracts 字段） */
interface IContractPayload {
  customer_id: number
  date: string
  direction: string
  status: string
  start_date: string
  end_date: string
  note: string
  items: { product_id: number, quantity: number, actual_price: number }[]
  services: { service_id: number | null, service_name: string, amount: number }[]
}

/** 前端表单模型 → 后端 payload（camelCase → snake_case 映射 + 状态中英转换） */
function toPayload(form: IContractForm): IContractPayload {
  return {
    customer_id: form.customerId!,
    date: form.date,
    direction: form.direction,
    status: denormalizeStatus(form.status),
    start_date: form.startDate,
    end_date: form.endDate,
    note: form.note,
    items: form.items.map((it: IContractFormItem) => ({
      product_id: it.productId,
      quantity: it.quantity,
      actual_price: it.actualPrice,
    })),
    services: form.services.map((sv: IContractFormService) => ({
      service_id: sv.serviceId,
      service_name: sv.serviceName,
      amount: sv.amount,
    })),
  }
}

/** 创建合同（含商品明细 + 服务费明细，事务内自动汇总金额） */
export function createContract(form: IContractForm): Promise<{ id: number }> {
  return http.post<{ id: number }>('/api/contracts', toPayload(form))
}

/** 更新合同（全量更新明细：先删后插） */
export function updateContract(id: number, form: IContractForm): Promise<{ success: boolean }> {
  return http.put<{ success: boolean }>(`/api/contracts/${id}`, toPayload(form))
}

/** 删除合同（级联删除 items/services） */
export function deleteContract(id: number): Promise<{ success: boolean }> {
  return http.delete<{ success: boolean }>(`/api/contracts/${id}`)
}
