<script lang="ts" setup>
import { computed } from 'vue'
import type { ICustomerData } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

const props = defineProps<{
  data: ICustomerData | null
  loading: boolean
}>()

/** 加载中/无数据时的占位文本 */
const PLACEHOLDER = '--'

/** 统一的金额格式化 */
function fmtMoney(v: number | undefined): string {
  return `¥${formatAmount(v ?? 0)}`
}

function fmtPct(v: number | undefined): string {
  return `${((v ?? 0) * 100).toFixed(1)}%`
}

// ---- KPI 列表 ----
const kpiList = computed(() => {
  if (props.loading || props.data === null) {
    return [
      { key: 'count', label: '客户数', value: PLACEHOLDER, desc: '累计客户', tone: 'neutral' as const },
      { key: 'active', label: '活跃客户', value: PLACEHOLDER, desc: '近 90 天有交易', tone: 'up' as const },
      { key: 'recv', label: '应收总额', value: PLACEHOLDER, desc: '待回款金额', tone: 'warn' as const },
    ]
  }
  const k = props.data.kpi
  return [
    { key: 'count', label: '客户数', value: String(k.customer_count), desc: '累计客户', tone: 'neutral' as const },
    { key: 'active', label: '活跃客户', value: String(k.active_count), desc: '近 90 天有交易', tone: 'up' as const },
    { key: 'recv', label: '应收总额', value: fmtMoney(k.total_receivable), desc: '待回款金额', tone: 'warn' as const },
  ]
})

// ---- Top 5 ----
const top5 = computed(() => props.data?.top5 ?? [])

// ---- 账龄分布 ----
const aging = computed(() => props.data?.aging)
const agingBars = computed(() => {
  const a = aging.value
  if (!a || a.total <= 0) return null
  const pct30 = Math.round((a.buckets.within30 / a.total) * 100)
  const pct60 = Math.round((a.buckets.within60 / a.total) * 100)
  const pctOver = 100 - pct30 - pct60
  return [
    { label: '30天内', pct: pct30, color: '#16A34A', value: fmtMoney(a.buckets.within30) },
    { label: '31-60天', pct: pct60, color: '#F59E0B', value: fmtMoney(a.buckets.within60) },
    { label: '60天以上', pct: pctOver, color: '#E5484D', value: fmtMoney(a.buckets.over60) },
  ]
})

// ---- 客户分层 ----
const tiers = computed(() => props.data?.tiers)
const tierBars = computed(() => {
  const t = tiers.value
  if (!t) return null
  const total = t.summary.A + t.summary.B + t.summary.C
  if (total <= 0) return null
  const pctA = Math.round((t.summary.A / total) * 100)
  const pctB = Math.round((t.summary.B / total) * 100)
  const pctC = 100 - pctA - pctB
  return [
    { label: 'A 高价值', pct: pctA, color: '#E5484D', count: t.summary.A, amount: fmtMoney(t.amounts.A) },
    { label: 'B 潜力', pct: pctB, color: '#F59E0B', count: t.summary.B, amount: fmtMoney(t.amounts.B) },
    { label: 'C 普通', pct: pctC, color: '#9AA1AC', count: t.summary.C, amount: fmtMoney(t.amounts.C) },
  ]
})

// ---- 账龄颜色标注函数 ----
function ageColor(days: number): string {
  if (days <= 30) return '#16A34A'
  if (days <= 60) return '#F59E0B'
  return '#E5484D'
}
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- 3 张 KPI 卡片：一行三列 -->
    <view class="mx-[-8rpx] flex flex-wrap">
      <view v-for="k in kpiList" :key="k.key" class="w-[45%] p-[8rpx]">
        <KpiCard :label="k.label" :value="k.value" :desc="k.desc" :tone="k.tone" />
      </view>
    </view>

    <!-- Top 5 客户贡献 -->
    <PanelCard title="Top 5 客户贡献">
      <view v-if="top5.length" class="mt-[8rpx]">
        <view
          v-for="(c, i) in top5"
          :key="c.customer_id"
          class="flex items-center justify-between border-b border-[#F2F3F5] px-[4rpx] py-[20rpx]"
          :class="{ 'border-b-0': i === top5.length - 1 }"
        >
          <view class="flex flex-1 flex-col gap-[6rpx] overflow-hidden">
            <view class="flex items-center gap-[10rpx]">
              <text
                class="flex h-[36rpx] w-[36rpx] items-center justify-center rounded-full text-[20rpx] font-bold text-white"
                :style="{ backgroundColor: i < 3 ? '#E5484D' : '#9AA1AC' }"
              >
                {{ i + 1 }}
              </text>
              <text class="truncate text-[28rpx] font-medium text-[#1F2329]">
                {{ c.customer_name }}
              </text>
            </view>
            <view class="ml-[46rpx] flex gap-[20rpx] text-[22rpx] text-[#6B7280]">
              <text>回款 {{ fmtMoney(c.cash) }}</text>
              <text>毛利率 {{ fmtPct(c.gm) }}</text>
              <text :style="{ color: ageColor(c.age_days) }">
                账龄 {{ c.age_days }}天
              </text>
            </view>
          </view>
          <view class="flex flex-col items-end gap-[4rpx]">
            <text class="text-[28rpx] font-bold text-[#E5484D]">
              {{ fmtMoney(c.sale) }}
            </text>
            <text class="text-[22rpx] text-[#F59E0B]">
              应收 {{ fmtMoney(c.receivable) }}
            </text>
          </view>
        </view>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[60rpx]">
        <text class="i-carbon-chart-bar-overlay text-[52rpx] text-[#D8DDE4]" />
        <text class="mt-[14rpx] text-[26rpx] text-[#9AA1AC]">
          {{ loading ? '加载中…' : '暂无数据' }}
        </text>
      </view>
    </PanelCard>

    <!-- 应收账龄分布 -->
    <PanelCard title="应收账龄分布">
      <view v-if="agingBars" class="mt-[8rpx]">
        <view
          v-for="bar in agingBars"
          :key="bar.label"
          class="mb-[24rpx]"
          :class="{ 'mb-0': bar === agingBars[agingBars.length - 1] }"
        >
          <view class="flex items-center justify-between text-[24rpx] text-[#6B7280]">
            <text>{{ bar.label }}</text>
            <text>{{ bar.value }} ({{ bar.pct }}%)</text>
          </view>
          <view class="mt-[10rpx] h-[14rpx] w-full overflow-hidden rounded-full bg-[#F2F3F5]">
            <view
              class="h-full rounded-full transition-all duration-300"
              :style="{ width: bar.pct + '%', backgroundColor: bar.color }"
            />
          </view>
        </view>
        <text class="mt-[12rpx] block text-[22rpx] text-[#9AA1AC]">
          应收总额 {{ fmtMoney(aging?.total) }}
        </text>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[60rpx]">
        <text class="i-carbon-chart-bar-overlay text-[52rpx] text-[#D8DDE4]" />
        <text class="mt-[14rpx] text-[26rpx] text-[#9AA1AC]">
          {{ loading ? '加载中…' : '暂无账龄数据' }}
        </text>
      </view>
    </PanelCard>

    <!-- 客户分层（A / B / C） -->
    <PanelCard title="客户分层（帕累托 ABC）">
      <view v-if="tierBars" class="mt-[8rpx]">
        <view
          v-for="bar in tierBars"
          :key="bar.label"
          class="mb-[24rpx]"
          :class="{ 'mb-0': bar === tierBars[tierBars.length - 1] }"
        >
          <view class="flex items-center justify-between text-[24rpx] text-[#6B7280]">
            <text>{{ bar.label }}</text>
            <text>{{ bar.count }} 个客户 · {{ bar.amount }}</text>
          </view>
          <view class="mt-[10rpx] h-[14rpx] w-full overflow-hidden rounded-full bg-[#F2F3F5]">
            <view
              class="h-full rounded-full transition-all duration-300"
              :style="{ width: bar.pct + '%', backgroundColor: bar.color }"
            />
          </view>
        </view>
        <text class="mt-[12rpx] block text-[22rpx] text-[#9AA1AC]">
          按帕累托原则：A 类贡献前 20% 销售额，B 类 20%-50%，C 类其余
        </text>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[60rpx]">
        <text class="i-carbon-chart-bar-overlay text-[52rpx] text-[#D8DDE4]" />
        <text class="mt-[14rpx] text-[26rpx] text-[#9AA1AC]">
          {{ loading ? '加载中…' : '暂无分层数据' }}
        </text>
      </view>
    </PanelCard>
  </view>
</template>
