import { http } from '@/http/http'
import { monthToDateRange } from './transaction'
import type { ICockpitData } from './types/analysis'

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
