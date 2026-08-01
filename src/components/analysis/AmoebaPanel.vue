<script lang="ts" setup>
import { computed } from 'vue'
import type { IAmoebaData } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

/**
 * 阿米巴核算（PRD 5.4.6）
 * 附加价值 / 盈亏临界用红色（正向），劳务费 / 劳动时间用中性色。
 */
const props = defineProps<{
  data: IAmoebaData | null
  loading: boolean
}>()

const PLACEHOLDER = '--'

function fmtMoney(v: number | undefined): string {
  return `¥${formatAmount(v ?? 0)}`
}

function fmtNum(v: number | undefined, decimals = 0): string {
  return (v ?? 0).toFixed(decimals)
}

// ---- 顶部：单位时间附加值 ----
const hourlyValue = computed(() => props.data?.hourly_added_value ?? 0)
const prevHourly = computed(() => props.data?.prev_hourly_added_value)

const hourlyDisplay = computed(() => {
  if (props.loading || props.data === null) return PLACEHOLDER
  return fmtNum(hourlyValue.value, 2)
})

const hourlyChange = computed(() => {
  // 仅当后端明确返回 null（无上月数据）时视为无环比；
  // prevHourly 为 0 时应正常计算（环比 = +∞%，按新增处理）
  if (prevHourly.value == null) return null
  const prev = prevHourly.value
  const change = hourlyValue.value - prev
  const pct = prev > 0 ? (change / prev) * 100 : 100
  return { amount: change, pct }
})

// ---- 4 张 KPI ----
const kpiList = computed(() => {
  if (props.loading || props.data === null) {
    return [
      { key: 'added', label: '附加价值总额', value: PLACEHOLDER, desc: '总收入 − 消耗 − 杂费', tone: 'up' as const },
      { key: 'hours', label: '总劳动时间', value: PLACEHOLDER, desc: '在岗员工工时', tone: 'neutral' as const },
      { key: 'salary', label: '单位时间劳务费', value: PLACEHOLDER, desc: '劳务费 / 工时', tone: 'neutral' as const },
      { key: 'be', label: '盈亏临界', value: PLACEHOLDER, desc: '附加值 − 劳务费', tone: 'up' as const },
    ]
  }
  const k = props.data.kpi
  return [
    { key: 'added', label: '附加价值总额', value: fmtMoney(k.added_value), desc: '总收入 − 消耗 − 杂费', tone: 'up' as const },
    { key: 'hours', label: '总劳动时间', value: `${fmtNum(k.total_hours, 0)} h`, desc: '在岗员工工时', tone: 'neutral' as const },
    { key: 'salary', label: '单位时间劳务费', value: `¥${fmtNum(k.hourly_labor_cost, 2)}`, desc: '劳务费 / 工时', tone: 'neutral' as const },
    { key: 'be', label: '盈亏临界', value: fmtMoney(k.breakeven), desc: '附加值 − 劳务费', tone: 'up' as const },
  ]
})

// ---- 各单元单位时间附加值 ----
const unitValues = computed(() => props.data?.unit_values ?? [])
const maxUnitValue = computed(() => {
  const vals = unitValues.value.map(u => u.added_value)
  return vals.length > 0 ? Math.max(...vals) : 1
})

const GREEN_COLORS = ['#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0']

// ---- 单元总贡献 ----
const unitContribs = computed(() => props.data?.unit_contribs ?? [])
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- 顶部提示：本月整体单位时间附加值及环比 -->
    <view class="border border-[#F5D9DA] rounded-[24rpx] bg-[#FDF2F2] px-[24rpx] py-[20rpx]">
      <text class="text-[24rpx] text-[#6B7280]">
        本月整体单位时间附加值
      </text>
      <view class="mt-[8rpx] flex items-baseline">
        <text class="text-[40rpx] text-[#E5484D] font-bold font-mono">
          {{ hourlyDisplay }}
        </text>
        <text class="ml-[10rpx] text-[24rpx] text-[#9AA1AC]">
          ¥/人·小时
        </text>
      </view>
      <view v-if="hourlyChange" class="mt-[6rpx] text-[22rpx]" :class="hourlyChange.amount >= 0 ? 'text-[#16A34A]' : 'text-[#E5484D]'">
        环比 {{ hourlyChange.amount >= 0 ? '↑' : '↓' }} {{ fmtMoney(Math.abs(hourlyChange.amount)) }}
        （{{ hourlyChange.pct >= 0 ? '+' : '' }}{{ hourlyChange.pct.toFixed(1) }}%）
      </view>
      <view v-else-if="!loading" class="mt-[6rpx] text-[22rpx] text-[#9AA1AC]">
        暂无上月数据可供环比
      </view>
    </view>

    <!-- 4 张 KPI 卡片 -->
    <view class="mx-[-8rpx] flex flex-wrap">
      <view v-for="k in kpiList" :key="k.key" class="w-[45%] p-[8rpx]">
        <KpiCard :label="k.label" :value="k.value" :desc="k.desc" :tone="k.tone" />
      </view>
    </view>

    <!-- 各单元单位时间附加值 -->
    <PanelCard title="各单元单位时间附加值">
      <view v-if="unitValues.length" class="mt-[8rpx]">
        <!-- 简易柱状图 -->
        <view class="flex items-end justify-around" style="height: 240rpx">
          <view
            v-for="(u, i) in unitValues"
            :key="u.unit"
            class="flex flex-col items-center gap-[8rpx]"
          >
            <text class="text-[20rpx] text-[#6B7280]">
              {{ fmtMoney(u.added_value) }}
            </text>
            <view
              class="w-[56rpx] rounded-t-[6rpx] transition-all duration-300"
              :style="{
                height: Math.max(8, (u.added_value / maxUnitValue) * 150) + 'rpx',
                backgroundColor: GREEN_COLORS[i % GREEN_COLORS.length],
              }"
            />
            <text class="text-[22rpx] text-[#9AA1AC] text-center max-w-[100rpx] truncate">
              {{ u.unit }}
            </text>
          </view>
        </view>
        <text
          v-if="data && !data.unit_hours_available"
          class="mt-[12rpx] block text-[22rpx] text-[#9AA1AC]"
        >
          注：当前工时数据未按单元记录，此处为各单元附加价值总额
        </text>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[60rpx]">
        <text class="i-carbon-chart-bar-overlay text-[52rpx] text-[#D8DDE4]" />
        <text class="mt-[14rpx] text-[26rpx] text-[#9AA1AC]">
          {{ loading ? '加载中…' : '暂无单元数据' }}
        </text>
      </view>
    </PanelCard>

    <!-- 单元总贡献 -->
    <PanelCard title="单元总贡献">
      <view v-if="unitContribs.length" class="mt-[8rpx]">
        <!-- 表头 -->
        <view class="mb-[12rpx] flex items-center rounded-[8rpx] bg-[#F2F3F5] px-[8rpx] py-[10rpx] text-[22rpx] text-[#9AA1AC]">
          <text class="flex-[2]">单元</text>
          <text class="flex-1 text-right">销售额</text>
          <text class="flex-1 text-right">经费</text>
          <text class="flex-1 text-right">附加值</text>
        </view>
        <!-- 数据行 -->
        <view
          v-for="(c, i) in unitContribs"
          :key="c.unit"
          class="flex items-center border-b border-[#F2F3F5] px-[8rpx] py-[16rpx]"
          :class="{ 'border-b-0': i === unitContribs.length - 1 }"
        >
          <text class="flex-[2] text-[26rpx] font-medium text-[#1F2329]">
            {{ c.unit }}
          </text>
          <text class="flex-1 text-right text-[24rpx] text-[#E5484D]">
            {{ fmtMoney(c.sales) }}
          </text>
          <text class="flex-1 text-right text-[24rpx] text-[#16A34A]">
            {{ fmtMoney(c.expense) }}
          </text>
          <text class="flex-1 text-right text-[24rpx] font-semibold"
            :style="{ color: c.added_value >= 0 ? '#E5484D' : '#16A34A' }"
          >
            {{ fmtMoney(c.added_value) }}
          </text>
        </view>
        <text
          v-if="data && !data.unit_hours_available"
          class="mt-[12rpx] block text-[22rpx] text-[#9AA1AC]"
        >
          注：工时及单位时间附加值因 work_hours 无单元字段暂不可用
        </text>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[60rpx]">
        <text class="i-carbon-table text-[52rpx] text-[#D8DDE4]" />
        <text class="mt-[14rpx] text-[26rpx] text-[#9AA1AC]">
          {{ loading ? '加载中…' : '暂无贡献数据' }}
        </text>
      </view>
    </PanelCard>
  </view>
</template>
