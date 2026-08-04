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

/**
 * 客户分析（PRD 5.4.2）
 */

/** 客户分析 3 项 KPI */
export interface ICustomerKpi {
  /** 累计客户数 */
  customer_count: number
  /** 近 90 天有交易的活跃客户数 */
  active_count: number
  /** 待回款金额（销售收入 − 现金收入） */
  total_receivable: number
}

/** Top 客户贡献行 */
export interface ICustomerTop {
  customer_id: number
  customer_name: string
  /** 销售额 */
  sale: number
  /** 回款额 */
  cash: number
  /** 应收 = sale − cash */
  receivable: number
  /** 毛利率 */
  gm: number
  /** 最近交易日期 */
  last_date: string
  /** 账龄（天） */
  age_days: number
}

/** 应收账龄分段 */
export interface ICustomerAging {
  buckets: {
    within30: number
    within60: number
    over60: number
  }
  /** 三段合计 */
  total: number
}

/** 客户分层条目 */
export interface ICustomerTierItem {
  name: string
  sale: number
  tier: 'A' | 'B' | 'C'
}

/** 客户分层汇总 */
export interface ICustomerTiers {
  list: ICustomerTierItem[]
  summary: { A: number, B: number, C: number }
  amounts: { A: number, B: number, C: number }
}

/** 客户分析聚合数据（后端 /api/analysis/customer 返回） */
export interface ICustomerData {
  kpi: ICustomerKpi
  top5: ICustomerTop[]
  aging: ICustomerAging
  tiers: ICustomerTiers
}

/**
 * 商品分析（PRD 5.4.3）
 */

/** 商品分析 3 项 KPI */
export interface IProductKpi {
  /** 在售商品 SKU 数 */
  sku_count: number
  /** 库存占用（在库金额） */
  inventory_value: number
  /** 平均毛利率（0-1 小数） */
  avg_gm: number
}

/** Top 商品销售行 */
export interface IProductTop {
  product_id: number
  product_name: string
  /** 销售额 */
  sale: number
  /** 毛利率（0-1 小数） */
  gm: number
  /** 当前库存数量 */
  stock: number
  /** 周转天数 */
  turnover_days: number
}

/** 商品预警项 */
export interface IProductAlert {
  level: 'red' | 'yellow'
  product_name: string
  product_id: number
  reason: string
  /** 预警类型：low_margin / low_stock / slow_turnover */
  type: 'low_margin' | 'low_stock' | 'slow_turnover'
}

/** 商品分析聚合数据（后端 /api/analysis/product 返回） */
export interface IProductData {
  kpi: IProductKpi
  top_products: IProductTop[]
  alerts: IProductAlert[]
  alert_count: { red: number, yellow: number }
}

/**
 * 合同分析（PRD 5.4.4）
 */

/** 合同分析 4 项 KPI */
export interface IContractKpi {
  /** 合同总额（本期签约） */
  total_amount: number
  /** 执行率 = 回款 / 合同金额（0-1 小数） */
  execution_rate: number
  /** 未回款金额 */
  unpaid_amount: number
  /** 按状态汇总 */
  status_summary: {
    in_progress: { count: number, amount: number }
    completed: { count: number, amount: number }
    dunning: { count: number, amount: number }
  }
}

/** 合同执行列表行 */
export interface IContractRow {
  id: number
  customer_name: string
  date: string
  /** 合同金额 */
  amount: number
  /** 已回款 */
  paid: number
  /** 未回款 */
  unpaid: number
  /** 状态：进行中 / 已完结 / 催收中 */
  status: string
  /** 账龄（天） */
  age_days: number
}

/** 合同分析聚合数据（后端 /api/analysis/contract 返回） */
export interface IContractData {
  kpi: IContractKpi
  contracts: IContractRow[]
}

/**
 * 费用分析（PRD 5.4.5）
 */

/** 费用构成条目 */
export interface IExpenseComposeItem {
  /** 费用类别名称（如"材料采购"/"员工工资"/"杂费支出"） */
  name: string
  /** 金额 */
  amount: number
}

/** 费用趋势月度数据点 */
export interface IExpenseTrendPoint {
  /** 月份 YYYY-MM */
  month: string
  /** 该月支出总额 */
  amount: number
}

/** 单元费用条目 */
export interface IExpenseUnitItem {
  /** 单元名称 */
  unit: string
  /** 费用金额 */
  amount: number
}

/** 费用分析聚合数据（后端 /api/analysis/expense 返回） */
export interface IExpenseData {
  /** 费用构成列表 */
  compose: IExpenseComposeItem[]
  /** 总支出 */
  total_expense: number
  /** 近 6 个月费用趋势 */
  trend: IExpenseTrendPoint[]
  /** 各单元费用 */
  units: IExpenseUnitItem[]
  /** 单元费用合计 */
  unit_total: number
}

/**
 * 阿米巴核算（PRD 5.4.6）
 */

/** 阿米巴核算 4 项 KPI */
export interface IAmoebaKpi {
  /** 附加价值总额 = 总收入 − 消耗成本 − 杂费 */
  added_value: number
  /** 总劳动时间（小时） */
  total_hours: number
  /** 单位时间劳务费 = 总劳务费 / 总工时 */
  hourly_labor_cost: number
  /** 盈亏临界 = 附加值 − 劳务费，盈余为正 */
  breakeven: number
}

/** 各单元单位时间附加值条目 */
export interface IAmoebaUnitValue {
  unit: string
  added_value: number
}

/** 单元总贡献行 */
export interface IAmoebaUnitContrib {
  unit: string
  /** 销售额 */
  sales: number
  /** 经费（材料+加工+杂费） */
  expense: number
  /** 附加价值总额 */
  added_value: number
  /** 工时（不可用时为 null） */
  hours: number | null
  /** 单位时间附加值（不可用时为 null） */
  hourly_value: number | null
}

/** 阿米巴核算聚合数据（后端 /api/analysis/amoeba 返回） */
export interface IAmoebaData {
  kpi: IAmoebaKpi
  /** 本月整体单位时间附加值（¥/人·小时） */
  hourly_added_value: number
  /** 上月单位时间附加值，null 表示无数据 */
  prev_hourly_added_value: number | null
  /** 各单元附加价值 */
  unit_values: IAmoebaUnitValue[]
  /** 各单元总贡献 */
  unit_contribs: IAmoebaUnitContrib[]
  /** 单元工时是否可用（恒为 false） */
  unit_hours_available: boolean
}

// ========== 看板 v2 新增类型 ==========

/** 按日收支趋势数据点 */
export interface IDailyTrendItem {
  date: string
  income: number
  expense: number
}

/** 收入构成项 */
export interface IIncomeComposeItem {
  name: string
  amount: number
}

/** 支出构成项 */
export interface IExpenseComposeItem {
  name: string
  amount: number
}

/** 每日趋势聚合数据（后端 /api/analysis/daily-trend 返回） */
export interface IDailyTrendData {
  trend: IDailyTrendItem[]
  incomeCompose: IIncomeComposeItem[]
  expenseCompose: IExpenseComposeItem[]
}

/** 库存明细项（看板精简版） */
export interface IInventoryItem {
  id: number
  productName: string
  category1: string
  quantity: number
  avgPrice: number
  /** 单行价值 = quantity × avgPrice */
  value: number
}

/** 库存列表返回 */
export interface IInventoryListData {
  items: IInventoryItem[]
  totalSku: number
  totalValue: number
  zeroStockSku: number
}

/** 看板 v2 统一数据 */
export interface IDashboardV2Data {
  /** 驾驶舱 KPI */
  cockpit: ICockpitData
  /** 阿米巴核算 */
  amoeba: IAmoebaData
  /** 每日收支趋势 + 构成 */
  dailyTrend: IDailyTrendData
  /** 库存总览 */
  inventory: IInventoryListData
}
