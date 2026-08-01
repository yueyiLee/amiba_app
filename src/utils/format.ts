/**
 * 金额格式化工具函数
 */

/** 千分位格式化金额（保留两位小数），对 NaN/Infinity 安全防御 */
export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount)) {
    return '0.00'
  }
  const fixed = amount.toFixed(2)
  const [intPart, decPart] = fixed.split('.')
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${formattedInt}.${decPart}`
}
