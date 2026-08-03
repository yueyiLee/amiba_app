/** 收入类型 */
export type IncomeType = '销售收入' | '现金收入'  | '其他收入'

/** 支出类型 */
export type ExpenseType = '材料采购' | '委托加工' | '杂费支出' | '税金' | '现金支出'

/** 收入类型可选项（向后兼容，新代码请通过 getExpenseTypes API 获取） */
export const INCOME_TYPES: IncomeType[] = ['销售收入', '现金收入',  '其他收入']

/** 支出类型可选项（向后兼容，新代码请通过 getExpenseTypes API 获取） */
export const EXPENSE_TYPES: ExpenseType[] = ['材料采购',  '委托加工', '杂费支出', "税金", "现金支出"]

/** 收支类型（来自 GET /api/expense-types） */
export interface IExpenseType {
  id: number
  name: string
  direction: 'income' | 'expense'
  /** 是否关联客户（控制客户选择器显隐） */
  linkCustomer: boolean
  /** 是否关联商品（控制商品选择器显隐） */
  linkProduct: boolean
  linkCat: string
  enabled: boolean
}

/** 单笔流水记录（字段名与后端保持一致） */
export interface ITransactionItem {
  id: number
  /** 金额，正数=收入，负数=支出 */
  amount: number
  /** 日期，格式 YYYY-MM-DD */
  date: string
  /** 分类，如"销售收款"、"采购" */
  type: string
  /** 对方名称（客户/供应商/员工） */
  customer_name?: string
  /** 关联商品 */
  product_name?: string
  /** 备注 */
  note?: string
}

/** 判断流水是否为收入 */
export function isIncome(item: ITransactionItem): boolean {
  return item.amount > 0
}

/** 收入/支出表单提交数据 */
export interface ITransactionForm {
  amount: number
  date: string
  type: string
  counterparty?: string
  /** 选中的客户/供应商 id（与现有客户列表关联） */
  customer_id?: number
  product?: string
  /** 选中的商品 id（与现有商品列表关联） */
  product_id?: number
  /** 关联的合同 id */
  contract_id?: number
  notes?: string
}

/** 流水列表项按日期分组后的结构 */
export interface ITransactionGroup {
  date: string
  dayOfWeek: string
  items: ITransactionItem[]
}

/**
 * 千分位格式化金额（保留两位小数），对 NaN/Infinity 安全防御。
 * @deprecated 请改用 @/utils/format 中的 formatAmount，该文件提供了安全的 isFinite 防御。
 */
export { formatAmount } from '@/utils/format'
