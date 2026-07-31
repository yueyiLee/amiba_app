import dayjs from 'dayjs'
import { getTransactionList } from './transaction'
import type { ITransactionItem } from './types/transaction'

/** 看板月度 4 大 KPI */
export interface IDashboardKpi {
  /** 营业收入（金额正数） */
  revenue: number
  /** 营业支出（金额取绝对值） */
  expense: number
  /** 净利润 = 收入 - 支出 */
  netProfit: number
  /** 经营现金 = 净流入（收入 - 支出） */
  cashFlow: number
  /** 利润率（百分比，保留 1 位小数） */
  profitRate: string
  /** 当月流水数 */
  transactionCount: number
}

/** 每日收支趋势，按日期升序返回 */
export interface IDashboardTrend {
  date: string
  income: number
  expense: number
  /** 当日净利润 */
  netProfit: number
}

/** 看板整体数据 */
export interface IDashboardData {
  month: string
  kpi: IDashboardKpi
  /** 当月每日趋势，length = 当月天数 */
  trend: IDashboardTrend[]
  /** 利润走势（每日累计净利，length = 当月天数） */
  profitTrend: IDashboardTrend[]
}

/** 汇总 KPI */
function calcKpi(list: ITransactionItem[]): IDashboardKpi {
  const revenue = list.filter(i => i.amount > 0).reduce((s, i) => s + i.amount, 0)
  const expense = list.filter(i => i.amount < 0).reduce((s, i) => s - i.amount, 0)
  const netProfit = revenue - expense
  const profitRate = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0'
  return {
    revenue,
    expense,
    netProfit,
    cashFlow: netProfit,
    profitRate,
    transactionCount: list.length,
  }
}

/** 按日聚合每日收支 */
function groupByDay(list: ITransactionItem[], month: string): IDashboardTrend[] {
  const d = dayjs(month, 'YYYY-MM')
  const days = d.daysInMonth()
  const map = new Map<string, { income: number, expense: number }>()
  for (let i = 1; i <= days; i++) {
    const date = d.date(i).format('YYYY-MM-DD')
    map.set(date, { income: 0, expense: 0 })
  }
  for (const item of list) {
    const bucket = map.get(item.date)
    if (!bucket)
      continue
    if (item.amount > 0)
      bucket.income += item.amount
    else
      bucket.expense += Math.abs(item.amount)
  }
  const trend: IDashboardTrend[] = []
  map.forEach((v, date) => {
    trend.push({
      date,
      income: v.income,
      expense: v.expense,
      netProfit: v.income - v.expense,
    })
  })
  return trend
}

/** 把每日净利折算为累计净利走势 */
function toCumulativeProfit(daily: IDashboardTrend[]): IDashboardTrend[] {
  let acc = 0
  return daily.map((d) => {
    acc += d.netProfit
    return { ...d, netProfit: acc }
  })
}

/**
 * 获取看板数据（按月聚合当前月份的 KPI + 每日趋势）
 * @param month YYYY-MM
 */
export async function getDashboard(month: string): Promise<IDashboardData> {
  const list = await getTransactionList(month)
  const daily = groupByDay(list, month)
  return {
    month,
    kpi: calcKpi(list),
    trend: daily,
    profitTrend: toCumulativeProfit(daily),
  }
}
