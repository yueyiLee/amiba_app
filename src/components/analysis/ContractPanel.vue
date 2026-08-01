<script lang="ts" setup>
import { computed } from 'vue'
import type { IContractData } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

const props = defineProps<{
  data: IContractData | null
  loading: boolean
}>()

const PLACEHOLDER = '--'

function fmtMoney(v: number | undefined): string {
  return `¥${formatAmount(v ?? 0)}`
}

function fmtPct(v: number | undefined): string {
  return `${((v ?? 0) * 100).toFixed(1)}%`
}

function fmtNum(v: number | undefined): string {
  return String(v ?? 0)
}

// ---- KPI 列表 ----
const kpiList = computed(() => {
  if (props.loading || props.data === null) {
    return [
      { key: 'total', label: '合同总额', value: PLACEHOLDER, desc: '本期签约', tone: 'up' as const },
      { key: 'rate', label: '执行率', value: PLACEHOLDER, desc: '回款 / 合同金额', tone: 'warn' as const },
      { key: 'unpaid', label: '未回款', value: PLACEHOLDER, desc: '待收金额', tone: 'warn' as const },
      { key: 'status', label: '进行中 / 已完结', value: PLACEHOLDER, desc: '按状态汇总', tone: 'neutral' as const },
    ]
  }
  const k = props.data.kpi
  const s = k.status_summary
  const statusText = `${s.in_progress.count}/${s.completed.count}`
  const statusDesc = `进行中 ${fmtMoney(s.in_progress.amount)} · 已完结 ${fmtMoney(s.completed.amount)}`
  return [
    { key: 'total', label: '合同总额', value: fmtMoney(k.total_amount), desc: '本期签约', tone: 'up' as const },
    { key: 'rate', label: '执行率', value: fmtPct(k.execution_rate), desc: '回款 / 合同金额', tone: 'warn' as const },
    { key: 'unpaid', label: '未回款', value: fmtMoney(k.unpaid_amount), desc: '待收金额', tone: 'warn' as const },
    { key: 'status', label: '进行中 / 已完结', value: statusText, desc: statusDesc, tone: 'neutral' as const },
  ]
})

// ---- 合同执行列表 ----
const contracts = computed(() => props.data?.contracts ?? [])

/** 状态标签颜色 */
function statusColor(status: string): string {
  const map: Record<string, string> = {
    '进行中': '#F59E0B',
    '已完结': '#16A34A',
    '催收中': '#E5484D',
  }
  return map[status] || '#9AA1AC'
}

function statusBg(status: string): string {
  const map: Record<string, string> = {
    '进行中': '#FFF7E6',
    '已完结': '#F0FFF4',
    '催收中': '#FFF0F0',
  }
  return map[status] || '#F2F3F5'
}

/** 账龄颜色 */
function ageColor(days: number): string {
  if (days <= 30) return '#16A34A'
  if (days <= 60) return '#F59E0B'
  return '#E5484D'
}
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- 4 张 KPI 卡片：一行两列 -->
    <view class="mx-[-8rpx] flex flex-wrap">
      <view v-for="k in kpiList" :key="k.key" class="w-[45%] p-[8rpx]">
        <KpiCard :label="k.label" :value="k.value" :desc="k.desc" :tone="k.tone" />
      </view>
    </view>

    <!-- 合同执行列表 -->
    <PanelCard title="合同执行列表">
      <view v-if="contracts.length" class="mt-[8rpx]">
        <view
          v-for="(c, i) in contracts"
          :key="c.id"
          class="border-b border-[#F2F3F5] px-[4rpx] py-[20rpx]"
          :class="{ 'border-b-0': i === contracts.length - 1 }"
        >
          <!-- 第一行：客户名 + 金额 + 状态 -->
          <view class="flex items-center justify-between">
            <view class="flex flex-1 items-center gap-[12rpx] overflow-hidden">
              <text class="truncate text-[28rpx] font-medium text-[#1F2329]">
                {{ c.customer_name }}
              </text>
              <view
                class="shrink-0 rounded-[6rpx] px-[12rpx] py-[4rpx] text-[20rpx] font-medium"
                :style="{ color: statusColor(c.status), backgroundColor: statusBg(c.status) }"
              >
                {{ c.status }}
              </view>
            </view>
            <text class="shrink-0 text-[28rpx] font-bold text-[#E5484D]">
              {{ fmtMoney(c.amount) }}
            </text>
          </view>
          <!-- 第二行：回款 / 未回款 / 账龄 -->
          <view class="mt-[8rpx] flex items-center justify-between text-[22rpx] text-[#6B7280]">
            <view class="flex gap-[24rpx]">
              <text>回款 {{ fmtMoney(c.paid) }}</text>
              <text class="text-[#F59E0B]">未回 {{ fmtMoney(c.unpaid) }}</text>
            </view>
            <text :style="{ color: ageColor(c.age_days) }">
              账龄 {{ c.age_days }}天
            </text>
          </view>
        </view>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[60rpx]">
        <text class="i-carbon-document text-[52rpx] text-[#D8DDE4]" />
        <text class="mt-[14rpx] text-[26rpx] text-[#9AA1AC]">
          {{ loading ? '加载中…' : '暂无合同数据' }}
        </text>
      </view>
    </PanelCard>
  </view>
</template>
