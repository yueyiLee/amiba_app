import { http } from '@/http/http'
import { monthToDateRange } from './transaction'
import type { ICockpitData, ICustomerData, IProductData, IContractData, IExpenseData, IAmoebaData, ICashData, IDailyTrendData, IInventoryListData, IDashboardV2Data } from './types/analysis'

/** 单元筛选默认值（后端约定：'全部单元' 表示不过滤） */
export const ALL_UNITS = '全部单元'

/**
 * 获取分析驾驶舱聚合数据（6 项 KPI + 预警清单 + Top 榜）
 * @param month 月份 YYYY-MM
 */
export function getCockpit(month: string): Promise<ICockpitData> {
  return http.get<ICockpitData>('/api/analysis/cockpit', {
    ...monthToDateRange(month),
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

/**
 * 获取资金分析聚合数据（PRD v2.1 §8）
 * 含现金收入/支出/净现金流/应收款 KPI、月度现金流趋势、应收账龄 Top 10
 * @param startDate YYYY-MM-DD
 * @param endDate YYYY-MM-DD
 */
export function getCashAnalysis(startDate: string, endDate: string): Promise<ICashData> {
  return http.get<ICashData>('/api/analysis/cash', {
    startDate,
    endDate,
  })
}

/**
 * 获取每日收支趋势 + 收支构成（看板 v2 专用）
 * @param startDate YYYY-MM-DD
 * @param endDate YYYY-MM-DD
 */
export function getDailyTrend(startDate: string, endDate: string): Promise<IDailyTrendData> {
  return http.get<IDailyTrendData>('/api/analysis/daily-trend', {
    startDate,
    endDate,
  })
}

/** 后端 /api/inventory 返回的单条库存记录 */
interface IRawInventoryItem {
  id: number
  productId: number
  quantity: number
  avgPrice: number
  productName: string
  category1: string
}

/**
 * 获取库存总览数据（看板 v2 专用）
 * 后端返回原始数组，前端计算概览指标
 */
export async function getInventoryOverview(): Promise<IInventoryListData> {
  const rawList = await http.get<IRawInventoryItem[]>('/api/inventory')
  const items = rawList.map((r) => ({
    id: r.id,
    productName: r.productName,
    category1: r.category1,
    quantity: r.quantity,
    avgPrice: r.avgPrice,
    value: r.quantity * r.avgPrice,
  }))
  return {
    items,
    totalSku: items.length,
    totalValue: items.reduce((s, i) => s + i.value, 0),
    zeroStockSku: items.filter(i => i.quantity <= 0).length,
  }
}

/**
 * 获取看板 v2 统一数据（并行请求所有模块接口）
 * @param startDate YYYY-MM-DD
 * @param endDate YYYY-MM-DD
 * @param rangeLabel 时间范围标签
 */
export async function getDashboardV2(
  startDate: string,
  endDate: string,
): Promise<IDashboardV2Data> {
  const [cockpit, amoeba, dailyTrend, inventory] = await Promise.all([
    http.get<ICockpitData>('/api/analysis/cockpit', { startDate, endDate }),
    http.get<IAmoebaData>('/api/analysis/amoeba', { startDate, endDate }),
    http.get<IDailyTrendData>('/api/analysis/daily-trend', { startDate, endDate }),
    getInventoryOverview(),
  ])

  return {
    cockpit,
    amoeba,
    dailyTrend,
    inventory,
  }
}
