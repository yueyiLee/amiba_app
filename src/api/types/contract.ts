/** 合同列表项（来自 GET /api/contracts，用于选择器下拉） */
export interface IContract {
  id: number
  /** 合同编号（如 HT-2025-001） */
  contractNo: string
  /** 关联客户 id */
  customerId: number
  /** 合同金额 */
  amount: number
  /** 状态：in_progress / completed / dunning */
  status: string
  startDate: string
  endDate: string
  date: string
  /** 合同方向：income / expense */
  direction: string
  note?: string
  /** 后端 JOIN 返回的客户名称 */
  customerName: string
  /** 后端拼接的展示名称（日期-客户-商品/服务） */
  display_name: string
}
