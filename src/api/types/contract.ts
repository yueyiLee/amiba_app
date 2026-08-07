/**
 * 合同相关类型定义（对齐后端 contracts / contract_items / contract_services 表）
 */

/** 合同状态：进行中 / 已完成 / 已取消 */
export type ContractStatus = 'in_progress' | 'completed' | 'cancelled'

/** 合同方向：sale=销售合同 / purchase=采购合同 */
export type ContractDirection = 'sale' | 'purchase'

/** 合同状态常量（含展示文案与配色，用于 chip/徽章渲染） */
export const CONTRACT_STATUSES: { value: ContractStatus, label: string, color: string, bg: string }[] = [
  { value: 'in_progress', label: '进行中', color: '#2e6cf0', bg: '#eaf1fe' },
  { value: 'completed', label: '已完成', color: '#16a34a', bg: '#e6f7ee' },
  { value: 'cancelled', label: '已取消', color: '#9aa1ac', bg: '#f1f3f5' },
]

/** 合同方向常量（含展示文案与配色） */
export const CONTRACT_DIRECTIONS: { value: ContractDirection, label: string, color: string }[] = [
  { value: 'sale', label: '销售', color: '#16a34a' },
  { value: 'purchase', label: '采购', color: '#e5484d' },
]

/** 合同列表项（来自 GET /api/contracts，后端 JOIN 返回） */
export interface IContract {
  id: number
  /** 合同编号（如 HT-2025-001） */
  contractNo: string
  /** 关联客户 id */
  customerId: number
  /** 合同总金额（后端自动汇总明细金额） */
  amount: number
  /** 状态：in_progress / completed / cancelled */
  status: ContractStatus
  startDate: string
  endDate: string
  /** 签订日期 */
  date: string
  /** 合同方向：sale / purchase */
  direction: ContractDirection
  note?: string
  /** 后端 JOIN 返回的客户名称 */
  customerName: string
  /** 后端拼接的展示名称（日期-客户-商品/服务） */
  display_name: string
  /** 商品明细 */
  items?: IContractItem[]
  /** 服务费明细 */
  services?: IContractServiceItem[]
}

/** 合同商品明细行项（contract_items 表） */
export interface IContractItem {
  id: number
  contractId: number
  productId: number
  /** 数量（整数） */
  quantity: number
  /** 实际交易单价 */
  actualPrice: number
  /** 行金额 = quantity × actualPrice */
  amount: number
  /** 后端 JOIN 返回的商品名称 */
  productName: string
}

/** 合同服务费明细行项（contract_services 表） */
export interface IContractServiceItem {
  id: number
  contractId: number
  serviceId: number | null
  /** 服务名称（后端冗余存储） */
  serviceName: string
  /** 实际服务费用 */
  amount: number
}

/** 合同详情（扩展字段，来自 GET /api/contracts 单条展开） */
export interface IContractDetail extends IContract {
  created_at?: string
  updated_at?: string
}

/** 合同表单提交数据（前端表单模型） */
export interface IContractForm {
  customerId: number | null
  direction: ContractDirection
  /** 签订日期 YYYY-MM-DD */
  date: string
  status: ContractStatus
  /** 开始日期 YYYY-MM-DD */
  startDate: string
  /** 结束日期 YYYY-MM-DD */
  endDate: string
  note: string
  items: IContractFormItem[]
  services: IContractFormService[]
}

/** 合同商品明细表单行（前端模型，对应后端 items[]） */
export interface IContractFormItem {
  /** 新建时无 id（或为 0），编辑时保留原始 id */
  id?: number
  productId: number
  quantity: number
  actualPrice: number
}

/** 合同服务费明细表单行（前端模型，对应后端 services[]） */
export interface IContractFormService {
  /** 新建时无 id（或为 0），编辑时保留原始 id */
  id?: number
  serviceId: number | null
  serviceName: string
  amount: number
}

// ========== 工具函数 ==========

/** 根据状态值获取展示文案 */
export function getStatusLabel(status: string): string {
  return CONTRACT_STATUSES.find(s => s.value === status)?.label ?? status
}

/** 根据状态值获取前景色 */
export function getStatusColor(status: string): string {
  return CONTRACT_STATUSES.find(s => s.value === status)?.color ?? '#6b7280'
}

/** 根据状态值获取背景色 */
export function getStatusBg(status: string): string {
  return CONTRACT_STATUSES.find(s => s.value === status)?.bg ?? '#f1f3f5'
}

/** 根据方向值获取展示文案 */
export function getDirectionLabel(direction: string): string {
  return CONTRACT_DIRECTIONS.find(d => d.value === direction)?.label ?? direction
}

/** 根据方向值获取前景色 */
export function getDirectionColor(direction: string): string {
  return CONTRACT_DIRECTIONS.find(d => d.value === direction)?.color ?? '#6b7280'
}

/** 安全的金额相加，规避浮点误差（如 0.1+0.2） */
function safeAdd(a: number, b: number): number {
  const factor = 100
  return (Math.round(a * factor) + Math.round(b * factor)) / factor
}

/** 商品明细小计 = Σ(quantity × actualPrice) */
export function calcItemsTotal(items: { quantity: number, actualPrice: number }[] | undefined): number {
  return (items || []).reduce((sum, i) => safeAdd(sum, (Number(i.quantity) || 0) * (Number(i.actualPrice) || 0)), 0)
}

/** 服务费小计 = Σ(amount) */
export function calcServicesTotal(services: { amount: number }[] | undefined): number {
  return (services || []).reduce((sum, s) => safeAdd(sum, Number(s.amount) || 0), 0)
}

/** 合同总金额 = 商品小计 + 服务费小计 */
export function calcContractTotal(items: { quantity: number, actualPrice: number }[] | undefined, services: { amount: number }[] | undefined): number {
  return calcItemsTotal(items) + calcServicesTotal(services)
}
