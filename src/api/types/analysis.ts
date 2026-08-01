/**
 * 分析模块类型定义
 * 字段命名与后端 /api/analysis/* 返回保持一致（snake_case）。
 */

/** 6 个分析子功能标识 */
export type AnalysisSeg = 'overview' | 'customer' | 'product' | 'contract' | 'expense' | 'amoeba'

/** 6 宫格子功能入口配置 */
export interface IAnalysisSegItem {
  key: AnalysisSeg
  label: string
}

/** 分析页 6 宫格（两行三列，顺序与 PRD 5.4 一致） */
export const ANALYSIS_SEGS: IAnalysisSegItem[] = [
  { key: 'overview', label: '驾驶舱' },
  { key: 'customer', label: '客户分析' },
  { key: 'product', label: '商品分析' },
  { key: 'contract', label: '合同分析' },
  { key: 'expense', label: '费用分析' },
  { key: 'amoeba', label: '阿米巴核算' },
]

/** KPI 语义色调：up=红（正向）/ down=绿（反向）/ warn=橙（风险）/ neutral=中性 */
export type KpiTone = 'up' | 'down' | 'warn' | 'neutral'

/**
 * 驾驶舱 6 项核心 KPI
 * 口径严格对齐 PC 端 calculator.js 的 calculateMetrics()
 */
export interface ICockpitKpi {
  /** 总销售额 = Σ(销售收入) */
  total_sales: number
  /** 总利润 = 附加价值 − 总工资 − 税金 */
  total_profit: number
  /** 应收账款 = 销售收入 − 现金收入 */
  receivable: number
  /** 应付账款 = 总支出 − 现金支出 */
  payable: number
  /** 净现金流 = 现金收入 − 现金支出 */
  net_cash_flow: number
  /** 库存占用 = Σ(库存数量 × 平均单价) */
  inventory_value: number
  /** 净利率（百分比数值，如 30.6 表示 30.6%） */
  profit_rate: number
  /** 附加价值 = 总收入 − 消耗成本 − 杂费 */
  added_value: number
  /** 总劳动时间（小时） */
  total_hours: number
  /** 总劳务费 */
  total_salary: number
}

/** 驾驶舱预警项 */
export interface ICockpitAlert {
  /** 预警级别：red 红色高危 / yellow 黄色关注 */
  level: 'red' | 'yellow'
  /** 主标题，如「客户【远大建材】应收 ¥128,000」 */
  title: string
  /** 副说明，如「超过预警阈值，建议立即跟进回款」 */
  sub: string
  /** 右侧数值展示文本 */
  value: string
  /** 点击跳转的目标面板 */
  jumpTo: AnalysisSeg
}

/** 驾驶舱 Top 榜条目 */
export interface ICockpitTop {
  /** 榜单名，如「Top 客户贡献」 */
  label: string
  /** 榜首名称，为空表示无数据 */
  name: string
  /** 榜首数值展示文本 */
  value: string
  /** 点击跳转的目标面板 */
  jumpTo: AnalysisSeg
}

/** 驾驶舱聚合数据（后端 /api/analysis/cockpit 返回） */
export interface ICockpitData {
  kpi: ICockpitKpi
  alerts: ICockpitAlert[]
  /** 红/黄预警条数统计 */
  alert_count: { red: number, yellow: number }
  tops: ICockpitTop[]
  /**
   * 单元工时数据是否可用。
   * 当前 work_hours / employees 表均无单元字段，无法按单元拆分工时，
   * 故「单元附加价值排行」降级为附加价值总额，此处恒为 false。
   */
  unit_hours_available: boolean
}
