/** 用户设置 key-value 映射（来自 GET /api/settings） */
export interface IUserSettings {
  amoeba_enabled?: string   // 'true' | 'false'
  currency?: string          // '¥' | '$' | '€'
  export_format?: string     // 'csv' | 'excel'
  units?: string             // JSON array: '["全公司","销售部",...]'
  active_units?: string      // JSON array: '["全公司","销售部",...]'
  [key: string]: unknown
}

/** 批量更新设置请求体 */
export interface IUpdateSettingsPayload {
  amoeba_enabled: string
  currency: string
  export_format: string
  units: string
  active_units: string
}

/** 收支类型新增/编辑表单 */
export interface IExpenseTypeForm {
  name: string
  direction: 'income' | 'expense'
  link_customer: boolean
  link_product: boolean
  link_cat: string  // '' | 'processing' | 'misc'
}

/** 收支类型更新参数 */
export interface IExpenseTypeUpdate {
  name?: string
  direction?: 'income' | 'expense'
  link_customer?: boolean
  link_product?: boolean
  link_cat?: string
  enabled?: boolean
}

/** 杂费类别新增/编辑表单 */
export interface IExpenseItemForm {
  kind: 'processing' | 'misc'
  name: string
  note: string
}

/** 经营单元项 */
export interface IUnitItem {
  name: string
  checked: boolean
  isDefault: boolean
}

/** 币种选项 */
export const CURRENCY_OPTIONS = [
  { value: '¥', label: '¥ 人民币 (CNY)' },
  { value: '$', label: '$ 美元 (USD)' },
  { value: '€', label: '€ 欧元 (EUR)' },
] as const

/** 导出格式选项 */
export const EXPORT_FORMAT_OPTIONS = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
] as const

/** 子类别分组选项 */
export const LINK_CAT_OPTIONS = [
  { value: '', label: '不关联' },
  { value: 'processing', label: '加工费' },
  { value: 'misc', label: '杂费' },
] as const

/** 杂费类别 kind 选项 */
export const EXPENSE_ITEM_KIND_OPTIONS = [
  { value: 'processing', label: '加工费' },
  { value: 'misc', label: '杂费' },
] as const
