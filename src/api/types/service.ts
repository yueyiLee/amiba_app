/**
 * 服务（服务费用）类型定义（对齐后端 services 表）
 */

/** 服务列表/详情返回结构（services 表） */
export interface IService {
  id: number
  /** 服务名称 */
  name: string
  /** 参考费用（元） */
  referenceCost: number
  /** 备注 */
  note?: string
  created_at?: string
}

/** 服务表单提交数据 */
export interface IServiceForm {
  id?: number
  name: string
  reference_cost: number
  note: string
}
