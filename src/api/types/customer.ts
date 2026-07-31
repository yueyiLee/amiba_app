/** 客户类型（chip 选择项，对齐后端 customers.type 枚举） */
export type CustomerType = '公司' | '个人' 

/** 客户列表/详情返回结构（后端 customers 表 + 关联信息） */
export interface ICustomer {
  id: number
  name: string
  type: CustomerType
  /** 后端自由文本字段，前端以 "姓名 电话" 格式存取 */
  contact: string
  address: string
  /** 备注（扩展字段） */
  notes?: string
  /** 应收金额（列表展示，扩展字段，单位：元） */
  receivable?: number
  /** 最近交易日期（列表展示，扩展字段，格式 YYYY-MM-DD） */
  last_transaction_date?: string
  created_at?: string
}

/** 客户表单提交数据（前端拆分的联系人 / 手机号） */
export interface ICustomerForm {
  id?: number
  name: string
  type: CustomerType
  /** 联系人姓名 */
  contactName: string
  /** 手机号 */
  phone: string
  address: string
  notes: string
}

/** 客户类型可选项 */
export const CUSTOMER_TYPES: CustomerType[] = ['公司',  '个人']

/** 从后端 contact 字段解析出联系人姓名与手机号 */
export function splitContact(contact?: string): { name: string; phone: string } {
  if (!contact)
    return { name: '', phone: '' }
  const idx = contact.indexOf(' ')
  if (idx === -1)
    return { name: contact, phone: '' }
  return { name: contact.slice(0, idx).trim(), phone: contact.slice(idx + 1).trim() }
}

/** 将联系人姓名与手机号拼接为后端 contact 字段 */
export function joinContact(contactName: string, phone: string): string {
  const name = contactName.trim()
  const tel = phone.trim()
  if (name && tel)
    return `${name} ${tel}`
  return name || tel
}
