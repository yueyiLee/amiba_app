import { http } from '@/http/http'
import { monthToDateRange } from './transaction'
import type { ICockpitData, ICustomerData, IProductData, IContractData, IExpenseData, IAmoebaData } from './types/analysis'

/** 单元筛选默认值（后端约定：'全部单元' 表示不过滤） */
export const ALL_UNITS = '全部单元'

/**
 * 获取分析驾驶舱聚合数据（6 项 KPI + 预警清单 + Top 榜）
 * @param month 月份 YYYY-MM
 * @param unit 阿米巴单元，默认「全部单元」
 */
export function getCockpit(month: string, unit: string = ALL_UNITS): Promise<ICockpitData> {
  return http.get<ICockpitData>('/api/analysis/cockpit', {
    ...monthToDateRange(month),
    unit,
  })
}

/**
 * 获取客户分析聚合数据（PRD 5.4.2）
 * @param month 月份 YYYY-MM
 */
export function getCustomerAnalysis(month: string): Promise<ICustomerData> {
  return http.get<ICustomerData>('/api/analysis/customer', {
    ...monthToDateRange(month),
  })
}

/**
 * 获取商品分析聚合数据（PRD 5.4.3）
 * @param month 月份 YYYY-MM
 */
export function getProductAnalysis(month: string): Promise<IProductData> {
  return http.get<IProductData>('/api/analysis/product', {
    ...monthToDateRange(month),
  })
}

/**
 * 获取合同分析聚合数据（PRD 5.4.4）
 * @param month 月份 YYYY-MM
 */
export function getContractAnalysis(month: string): Promise<IContractData> {
  return http.get<IContractData>('/api/analysis/contract', {
    ...monthToDateRange(month),
  })
}

/**
 * 获取费用分析聚合数据（PRD 5.4.5）
 * @param month 月份 YYYY-MM
 */
export function getExpenseAnalysis(month: string): Promise<IExpenseData> {
  return http.get<IExpenseData>('/api/analysis/expense', {
    ...monthToDateRange(month),
  })
}

/**
 * 获取阿米巴核算聚合数据（PRD 5.4.6）
 * @param month 月份 YYYY-MM
 */
export function getAmoebaAnalysis(month: string): Promise<IAmoebaData> {
  return http.get<IAmoebaData>('/api/analysis/amoeba', {
    ...monthToDateRange(month),
  })
}
