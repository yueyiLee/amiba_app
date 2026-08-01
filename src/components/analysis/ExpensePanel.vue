<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { IExpenseData } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

/**
 * 费用分析（PRD 5.4.5）
 * 视觉统一使用绿色语义（支出/反向），不得使用红/橙。
 */
const props = defineProps<{
  data: IExpenseData | null
  loading: boolean
}>()

type ExpenseTab = 'compose' | 'trend' | 'unit'

const TABS: { key: ExpenseTab, label: string }[] = [
  { key: 'compose', label: '费用构成' },
  { key: 'trend', label: '费用趋势' },
  { key: 'unit', label: '单元费用' },
]

const activeTab = ref<ExpenseTab>('compose')

const tabTitle = computed(() => TABS.find(t => t.key === activeTab.value)?.label ?? '')

const PLACEHOLDER = '--'

function fmtMoney(v: number | undefined): string {
  return `¥${formatAmount(v ?? 0)}`
}

// ---- 费用构成 ----
const composeList = computed(() => props.data?.compose ?? [])
const totalExpense = computed(() => props.data?.total_expense ?? 0)

const composeBars = computed(() => {
  if (totalExpense.value <= 0) return []
  return composeList.value.map(item => ({
    name: item.name,
    amount: item.amount,
    pct: Math.round((item.amount / totalExpense.value) * 100),
  }))
})

// 纯绿系渐变色
const GREEN_COLORS = ['#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#BBF7D0']

// ---- 费用趋势 ----
const trendList = computed(() => props.data?.trend ?? [])
const trendMax = computed(() => {
  const vals = trendList.value.map(t => t.amount)
  return vals.length > 0 ? Math.max(...vals) : 1
})

function trendMonthLabel(m: string): string {
  // "2026-08" → "8月"
  const parts = m.split('-')
  const month = parseInt(parts[1], 10)
  if (parts.length < 2 || Number.isNaN(month)) return m || '--'
  return `${month}月`
}

// ---- 单元费用 ----
const unitList = computed(() => props.data?.units ?? [])
const unitTotal = computed(() => props.data?.unit_total ?? 0)
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- 三段二级标签 -->
    <view class="flex rounded-[20rpx] bg-[#EEF1F6] p-[6rpx]">
      <view
        v-for="t in TABS"
        :key="t.key"
        class="flex-1 p-[3rpx]"
        hover-class="opacity-60"
        @click="activeTab = t.key"
      >
        <view
          class="h-[60rpx] flex items-center justify-center rounded-[16rpx] text-[25rpx] font-semibold"
          :class="
            activeTab === t.key
              ? 'bg-white text-[#16A34A] shadow-[0_2rpx_8rpx_rgba(22,163,74,0.12)]'
              : 'text-[#6B7280]'
          "
        >
          {{ t.label }}
        </view>
      </view>
    </view>

    <!-- ====== 费用构成 ====== -->
    <PanelCard v-if="activeTab === 'compose'" title="费用构成">
      <view v-if="composeBars.length" class="mt-[8rpx]">
        <view
          v-for="(bar, i) in composeBars"
          :key="bar.name"
          class="mb-[24rpx]"
          :class="{ 'mb-0': i === composeBars.length - 1 }"
        >
          <view class="flex items-center justify-between text-[24rpx] text-[#6B7280]">
            <text>{{ bar.name }}</text>
            <text>{{ fmtMoney(bar.amount) }} ({{ bar.pct }}%)</text>
          </view>
          <view class="mt-[10rpx] h-[14rpx] w-full overflow-hidden rounded-full bg-[#F2F3F5]">
            <view
              class="h-full rounded-full transition-all duration-300"
              :style="{ width: bar.pct + '%', backgroundColor: GREEN_COLORS[i % GREEN_COLORS.length] }"
            />
          </view>
        </view>
        <text class="mt-[12rpx] block text-[22rpx] text-[#9AA1AC]">
          本期总支出 {{ fmtMoney(totalExpense) }}
        </text>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[60rpx]">
        <text class="i-carbon-chart-bar-overlay text-[52rpx] text-[#D8DDE4]" />
        <text class="mt-[14rpx] text-[26rpx] text-[#9AA1AC]">
          {{ loading ? '加载中…' : '暂无费用数据' }}
        </text>
      </view>
    </PanelCard>

    <!-- ====== 费用趋势 ====== -->
    <PanelCard v-if="activeTab === 'trend'" title="费用趋势（近 6 个月）">
      <view v-if="trendList.length" class="mt-[8rpx]">
        <!-- 简易柱状图 -->
        <view class="flex items-end justify-around" style="height: 280rpx">
          <view
            v-for="(t, i) in trendList"
            :key="t.month"
            class="flex flex-col items-center gap-[10rpx]"
          >
            <text class="text-[20rpx] text-[#6B7280]">
              {{ fmtMoney(t.amount) }}
            </text>
            <view
              class="w-[48rpx] rounded-t-[6rpx] transition-all duration-300"
              :style="{
                height: Math.max(8, (t.amount / trendMax) * 180) + 'rpx',
                backgroundColor: GREEN_COLORS[i % GREEN_COLORS.length],
              }"
            />
            <text class="text-[22rpx] text-[#9AA1AC]">
              {{ trendMonthLabel(t.month) }}
            </text>
          </view>
        </view>
        <!-- 环比变化 -->
        <view class="mt-[24rpx] rounded-[12rpx] bg-[#F0FDF4] px-[20rpx] py-[16rpx]">
          <text class="text-[22rpx] text-[#16A34A]">
            {{ trendList.length >= 2
              ? `较上月 ${fmtMoney(trendList[trendList.length - 1].amount - trendList[trendList.length - 2].amount)}`
              : '暂无环比数据'
            }}
          </text>
        </view>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[60rpx]">
        <text class="i-carbon-chart-line-data text-[52rpx] text-[#D8DDE4]" />
        <text class="mt-[14rpx] text-[26rpx] text-[#9AA1AC]">
          {{ loading ? '加载中…' : '暂无趋势数据' }}
        </text>
      </view>
    </PanelCard>

    <!-- ====== 单元费用 ====== -->
    <PanelCard v-if="activeTab === 'unit'" title="单元费用">
      <view v-if="unitList.length" class="mt-[8rpx]">
        <view
          v-for="(u, i) in unitList"
          :key="u.unit"
          class="flex items-center justify-between border-b border-[#F2F3F5] px-[4rpx] py-[20rpx]"
          :class="{ 'border-b-0': i === unitList.length - 1 }"
        >
          <view class="flex flex-1 items-center gap-[12rpx]">
            <text
              class="flex h-[36rpx] w-[36rpx] items-center justify-center rounded-full text-[20rpx] font-bold text-white"
              :style="{ backgroundColor: GREEN_COLORS[i % GREEN_COLORS.length] }"
            >
              {{ i + 1 }}
            </text>
            <text class="text-[28rpx] font-medium text-[#1F2329]">
              {{ u.unit }}
            </text>
          </view>
          <view class="flex items-center gap-[16rpx]">
            <text class="text-[22rpx] text-[#9AA1AC]">
              {{ unitTotal > 0 ? Math.round((u.amount / unitTotal) * 100) : 0 }}%
            </text>
            <text class="text-[28rpx] font-bold text-[#16A34A]">
              {{ fmtMoney(u.amount) }}
            </text>
          </view>
        </view>
        <text class="mt-[12rpx] block text-[22rpx] text-[#9AA1AC]">
          单元费用合计 {{ fmtMoney(unitTotal) }}
        </text>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[60rpx]">
        <text class="i-carbon-chart-bar-overlay text-[52rpx] text-[#D8DDE4]" />
        <text class="mt-[14rpx] text-[26rpx] text-[#9AA1AC]">
          {{ loading ? '加载中…' : '暂无单元数据' }}
        </text>
      </view>
    </PanelCard>
  </view>
</template>
