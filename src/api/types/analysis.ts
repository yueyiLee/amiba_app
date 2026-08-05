/**
 * 分析模块类型定义
 * 字段命名与后端 /api/analysis/* 返回保持一致（snake_case）。
 */

/** 6 个分析子功能标识 */
export type AnalysisSeg = 'overview' | 'customer' | 'product' | 'contract' | 'expense' | 'cash'

/** 6 宫格子功能入口配置 */
export interface IAnalysisSegItem {
  key: AnalysisSeg
  label: string
  icon: string
}

/** 分析页 6 宫格（两行三列，顺序与 PRD v2.1 一致） */
export const ANALYSIS_SEGS: IAnalysisSegItem[] = [
  { key: 'overview', label: '经营总览', icon: '🧭' },
  { key: 'customer', label: '客户分析', icon: '👥' },
  { key: 'product', label: '商品分析', icon: '📦' },
  { key: 'contract', label: '合同分析', icon: '📄' },
  { key: 'expense', label: '费用分析', icon: '💸' },
  { key: 'cash', label: '资金分析', icon: '💰' },
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
 * 商品分析（PRD v2.1 §5）
 * 收入/支出双视角 + 价格变动 + 商品明细
 */

/** 收入类 KPI（PRD v2.1 §5.1） */
export interface IProductSalesKpi {
  /** 销售总数量（整数） */
  total_qty: number
  /** 销售总金额 */
  total_sale: number
  /** 平均毛利率（0-1 小数，加权口径） */
  avg_gm: number
}

/** 支出类 KPI（PRD v2.1 §5.1） */
export interface IProductPurchaseKpi {
  /** 采购总数量（整数） */
  total_qty: number
  /** 采购总成本 */
  total_cost: number
}

/** 商品排行条目（数量榜与金额榜复用，PRD v2.1 §5.1） */
export interface IProductRankItem {
  product_id: number
  product_name: string
  /** 数量（数量榜用） */
  qty: number
  /** 金额（金额榜用） */
  amount: number
}

/** 商品价格变动条目（PRD v2.1 §5.1） */
export interface IProductPriceChange {
  /** 商品 ID（价格变动榜可能为 null，来自多笔成交聚合） */
  product_id?: number
  product_name?: string
  /** 最低成交价 */
  min_price: number
  /** 最高成交价 */
  max_price: number
  /** 变动幅度（0-1 小数，正=涨、负=跌） */
  change_rate: number
  /** 成交样本数 */
  sample_count: number
}

/** 收入类聚合数据 */
export interface IProductSalesData {
  kpi: IProductSalesKpi
  /** 销售数量 TOP5 */
  by_qty: IProductRankItem[]
  /** 销售金额 TOP5 */
  by_amount: IProductRankItem[]
  /** 实际销售价变动 TOP5 */
  price_change: IProductPriceChange[]
}

/** 支出类聚合数据 */
export interface IProductPurchaseData {
  kpi: IProductPurchaseKpi
  /** 采购数量 TOP5 */
  by_qty: IProductRankItem[]
  /** 采购成本 TOP5 */
  by_amount: IProductRankItem[]
  /** 实际采购价变动 TOP5 */
  price_change: IProductPriceChange[]
}

/** 商品明细行（跨 Tab 固定，PRD v2.1 §5.1） */
export interface IProductDetailRow {
  product_id: number
  /** 商品名称 */
  name: string
  /** 销售总额 */
  sale_amt: number
  /** 采购总成本 */
  cost_amt: number
  /** 销售数量 */
  sale_qty: number
  /** 采购数量 */
  purchase_qty: number
  /** 毛利率（0-1 小数） */
  gm: number
}

/** 商品分析聚合数据（后端 /api/analysis/product 返回，PRD v2.1 §13） */
export interface IProductData {
  /** 收入类（销售）数据 */
  sales: IProductSalesData
  /** 支出类（采购）数据 */
  purchase: IProductPurchaseData
  /** 商品明细列表 */
  detail: IProductDetailRow[]
}

/**
 * 合同分析（PRD v2.1 §6）
 */

/** 合同分析 3 项 KPI（PRD v2.1 §6.1） */
export interface IContractKpi {
  /** 合同总金额 = Σ 各合同金额 */
  total_amount: number
  /** 已回款 = Σ 各合同对应客户的现金收入 */
  total_paid: number
  /** 未回款 = 合同总金额 − 已回款（下限 0） */
  total_unpaid: number
}

/** 合同明细行（PRD v2.1 §6.1） */
export interface IContractRow {
  /** 合同 ID */
  id: number
  /** 合同展示名（优先 contractNo，缺失回退 #合同ID） */
  name: string
  /** 客户名称 */
  customer: string
  /** 合同金额 */
  amount: number
  /** 已回款金额 */
  paid: number
  /** 未回款金额 */
  unpaid: number
  /** 执行率 = 已回款 ÷ 合同金额（0-1 小数，上限 1.0） */
  ratio: number
  /** 状态徽章：回款滞后 / 执行中 / 健康（由执行率派生） */
  status: string
  /** 合同开始日期 YYYY-MM-DD */
  start_date: string
  /** 合同结束日期 YYYY-MM-DD */
  end_date: string
}

/** 合同分析聚合数据（后端 /api/analysis/contract 返回，PRD v2.1 §13） */
export interface IContractData {
  kpi: IContractKpi
  rows: IContractRow[]
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

// ========== 资金分析（PRD v2.1 §8） ==========

/** 资金分析 4 项 KPI */
export interface ICashKpi {
  /** 现金收入 */
  cash_in: number
  /** 现金支出（绝对值） */
  cash_out: number
  /** 净现金流 = 现金收入 − 现金支出 */
  net_cash: number
  /** 应收款 = 销售收入 − 现金收入 */
  receivable: number
}

/** 月度现金流行数据点 */
export interface ICashTrendPoint {
  /** 月份 YYYY-MM */
  month: string
  /** 现金收入 */
  in: number
  /** 现金支出 */
  out: number
  /** 净额 */
  net: number
}

/** 应收账龄条目 */
export interface ICashAgingItem {
  /** 客户 ID */
  customer_id: number
  /** 客户名称 */
  name: string
  /** 账龄天数 */
  days: number
  /** 应收金额 */
  amount: number
  /** 分档：超期 / 关注 / 正常 */
  bucket: 'overdue' | 'watch' | 'normal'
}

/** 资金分析聚合数据（后端 /api/analysis/cash 返回） */
export interface ICashData {
  kpi: ICashKpi
  /** 月度现金流行 */
  trend: ICashTrendPoint[]
  /** 应收账龄 Top 10 */
  aging: ICashAgingItem[]
  /** 是否展示挂账空态引导：现金收入=0 且现金支出=0 且应收款>0 时为 true */
  show_receivable_guide: boolean
  /** 挂账应收款金额（用于空态引导文案） */
  pending_receivable: number
}

// ========== 经营总览（PRD v2.1 §3） ==========

/** 经营总览 6 项 KPI（PRD v2.1 §3.1） */
export interface IOverviewKpi {
  /** 本期销售收入 = Σ 交易类型「销售收入」 */
  sales_income: number
  /** 本期应收款 = 销售收入 − 现金收入 */
  receivable: number
  /** 本期附加价值 = 总收入 − 消费支出（材料+委托加工）− 杂费支出 */
  added_value: number
  /** 单位时间附加价值 = 附加价值 ÷ 总工时（¥/h） */
  unit_added_value: number
  /** 本期总支出 = 材料采购 + 委托加工 + 杂费支出 + 缴纳税金（不含员工工资） */
  total_expense: number
  /** 本期总利润 = 附加价值 − 总工资 − 缴纳税金 */
  total_profit: number
}

/** 预警等级（PRD v2.1 §3.4 表 3.4.1） */
export type AlertLevel = 'red' | 'yellow'

/** 预警条目（PRD v2.1 §3.4 表 3.4.1） */
export interface IOverviewAlert {
  /** 预警等级 */
  level: AlertLevel
  /** 预警标题（例：客户大额应收） */
  title: string
  /** 预警描述（例：张×× — ¥ 85,000） */
  sub: string
  /** 点击跳转的目标面板 */
  jump_to: AnalysisSeg
  /** 跳转后高亮匹配的关键词 */
  jump_key?: string
}

/** 客户 Top 5 条目（PRD v2.1 §3.5） */
export interface IOverviewTopCustomer {
  /** 客户 ID */
  id: number
  /** 客户名称 */
  name: string
  /** 本期销售额 */
  sale: number
  /** 本期应收 */
  receivable: number
  /** 最近一次交易日期 YYYY-MM-DD */
  last_date: string
  /** 客户状态标签 */
  status: 'normal' | 'late' | 'risk'
}

/** 商品 Top 5 条目（PRD v2.1 §3.5） */
export interface IOverviewTopProduct {
  /** 商品名称 */
  name: string
  /** 本期销售额 */
  sale: number
}

/** 经营总览聚合数据（/api/analysis/overview 返回，PRD v2.1 §3） */
export interface IOverviewData {
  kpi: IOverviewKpi
  /** 预警清单 */
  alerts: IOverviewAlert[]
  /** 预警计数 */
  alert_count: { red: number, yellow: number }
  /** Top 5 客户 */
  top_customers: IOverviewTopCustomer[]
  /** Top 5 商品 */
  top_products: IOverviewTopProduct[]
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
