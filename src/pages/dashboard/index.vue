<script lang="ts" setup>
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { getDashboard } from '@/api/dashboard'
import type { IDashboardData, IDashboardTrend } from '@/api/dashboard'
import { formatAmount } from '@/api/types/transaction'

definePage({
  style: {
    navigationBarTitleText: '看板',
  },
})

// 当前展示月份
const currentDate = ref(dayjs())
const currentMonth = computed(() => currentDate.value.format('YYYY-MM'))

// 看板数据
const dashboard = ref<IDashboardData | null>(null)
const loading = ref(false)

/** 加载当月数据 */
async function loadData() {
  loading.value = true
  try {
    dashboard.value = await getDashboard(currentMonth.value)
  }
  catch {
    dashboard.value = null
  }
  finally {
    loading.value = false
  }
}

// 月份选择器
const monthPickerRef = ref<any>(null)
const monthPickerValue = computed(() => currentDate.value.valueOf())

function openMonthPicker() {
  monthPickerRef.value?.open()
}

function onMonthConfirm({ value }: { value: number }) {
  currentDate.value = dayjs(value)
  loadData()
}

// 副标题：2026年7月 · 经营全景
const headerSub = computed(() => `${currentDate.value.year()}年${currentDate.value.month() + 1}月 · 经营全景`)

// KPI
const kpi = computed(() => dashboard.value?.kpi)

/** 仅保留有数据的日期 */
const activeTrend = computed<IDashboardTrend[]>(() => {
  const list = dashboard.value?.trend ?? []
  return list.filter(d => d.income > 0 || d.expense > 0)
})

const maxTrendValue = computed(() => {
  const list = activeTrend.value
  if (list.length === 0)
    return 1
  return list.reduce((m, d) => Math.max(m, d.income, d.expense), 0)
})

/**
 * 利润走势 SVG 计算：
 * - 用 viewBox=320x120，自适应缩放至容器宽度
 * - 折线点为每个有数据的日期（累计净利）
 * - 避免空数据下渲染异常
 */
const profitPoints = computed(() => {
  const list = activeTrend.value
  if (list.length === 0)
    return { path: '', dots: [] as { x: number, y: number }[] }
  // 累计净利 = sum(每日 income - expense)
  let acc = 0
  const series: { day: number, val: number }[] = []
  list.forEach((d) => {
    acc += d.income - d.expense
    series.push({ day: d.date, val: acc })
  })
  const maxV = Math.max(1, ...series.map(s => s.val))
  const minV = Math.min(0, ...series.map(s => s.val))
  const range = Math.max(1, maxV - minV)
  const paddingX = 10
  const paddingY = 20
  const innerW = 320 - paddingX * 2
  const innerH = 120 - paddingY * 2
  const step = series.length > 1 ? innerW / (series.length - 1) : 0
  const dots = series.map((s, i) => ({
    x: paddingX + i * step,
    y: paddingY + innerH - ((s.val - minV) / range) * innerH,
  }))
  const path = dots
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')
  return { path, dots }
})

onShow(() => {
  loadData()
})
</script>

<template>
  <view class="min-h-screen bg-[#F4F6F9]">
    <!-- 状态栏占位 -->
    <view class="pt-safe" />

    <!-- 顶部标题栏 -->
    <view class="flex flex-row items-center justify-between px-[32rpx] pt-[12rpx] pb-[20rpx]">
      <view>
        <view class="text-[42rpx] font-bold text-[#1F2329] leading-[52rpx]">
          看板
        </view>
        <view class="text-[24rpx] text-[#6B7280] mt-[4rpx]">
          {{ headerSub }}
        </view>
      </view>
      <view
        class="w-[76rpx] h-[76rpx] rounded-[24rpx] bg-white border border-[#E5E7EB] flex items-center justify-center"
        hover-class="opacity-60"
        @click="loadData"
      >
        <text class="i-carbon-add text-[40rpx] text-[#1F2329]" />
      </view>
    </view>

    <!-- 月份切换 -->
    <view
      class="mx-[32rpx] mb-[20rpx] h-[72rpx] bg-white rounded-[20rpx] border border-[#E5E7EB] flex flex-row items-center justify-between px-[24rpx]"
      hover-class="opacity-60"
      @click="openMonthPicker"
    >
      <text class="text-[28rpx] text-[#1F2329]">当前月份：{{ currentMonth }}</text>
      <text class="i-carbon-chevron-down text-[30rpx] text-[#6B7280]" />
    </view>
    <wd-calendar
      ref="monthPickerRef"
      v-model="monthPickerValue"
      type="month"
      :with-cell="false"
      :min-date="dayjs().subtract(10, 'year').valueOf()"
      :max-date="dayjs().valueOf()"
      :z-index="2000"
      :root-portal="true"
      @confirm="onMonthConfirm"
    />

    <!-- 4 大 KPI 卡片：使用 flex 50% 宽 + 负 margin 实现两列 -->
    <view class="flex flex-row flex-wrap mx-[24rpx]">
      <view class="w-[50%] px-[8rpx] mb-[16rpx] box-border">
        <view class="bg-white rounded-[24rpx] p-[24rpx] border border-[#EEF1F6]">
          <view class="flex flex-row items-center justify-between mb-[12rpx]">
            <text class="text-[24rpx] text-[#6B7280]">营业收入</text>
            <view class="w-[12rpx] h-[12rpx] rounded-full bg-[#E5484D]" />
          </view>
          <view class="text-[40rpx] font-bold text-[#E5484D] font-mono">
            ¥{{ kpi ? formatAmount(kpi.revenue) : '0.00' }}
          </view>
          <view class="text-[22rpx] text-[#9AA1AC] mt-[8rpx]">
            {{ kpi ? `${kpi.transactionCount} 笔流水` : '暂无数据' }}
          </view>
        </view>
      </view>

      <view class="w-[50%] px-[8rpx] mb-[16rpx] box-border">
        <view class="bg-white rounded-[24rpx] p-[24rpx] border border-[#EEF1F6]">
          <view class="flex flex-row items-center justify-between mb-[12rpx]">
            <text class="text-[24rpx] text-[#6B7280]">营业支出</text>
            <view class="w-[12rpx] h-[12rpx] rounded-full bg-[#16A34A]" />
          </view>
          <view class="text-[40rpx] font-bold text-[#16A34A] font-mono">
            ¥{{ kpi ? formatAmount(kpi.expense) : '0.00' }}
          </view>
          <view class="text-[22rpx] text-[#9AA1AC] mt-[8rpx]">
            本月支出累计
          </view>
        </view>
      </view>

      <view class="w-[50%] px-[8rpx] mb-[16rpx] box-border">
        <view class="bg-white rounded-[24rpx] p-[24rpx] border border-[#EEF1F6]">
          <view class="flex flex-row items-center justify-between mb-[12rpx]">
            <text class="text-[24rpx] text-[#6B7280]">净利润</text>
            <view class="w-[12rpx] h-[12rpx] rounded-full bg-[#E5484D]" />
          </view>
          <view class="text-[40rpx] font-bold text-[#E5484D] font-mono">
            ¥{{ kpi ? formatAmount(kpi.netProfit) : '0.00' }}
          </view>
          <view class="text-[22rpx] text-[#9AA1AC] mt-[8rpx]">
            利润率 {{ kpi?.profitRate ?? '0.0' }}%
          </view>
        </view>
      </view>

      <view class="w-[50%] px-[8rpx] mb-[16rpx] box-border">
        <view class="bg-white rounded-[24rpx] p-[24rpx] border border-[#EEF1F6]">
          <view class="flex flex-row items-center justify-between mb-[12rpx]">
            <text class="text-[24rpx] text-[#6B7280]">经营现金</text>
            <view class="w-[12rpx] h-[12rpx] rounded-full bg-[#0070CC]" />
          </view>
          <view class="text-[40rpx] font-bold text-[#1F2329] font-mono">
            ¥{{ kpi ? formatAmount(kpi.cashFlow) : '0.00' }}
          </view>
          <view class="text-[22rpx] text-[#9AA1AC] mt-[8rpx]">
            {{ kpi && kpi.cashFlow >= 0 ? '净流入' : '净流出' }}
          </view>
        </view>
      </view>
    </view>

    <!-- 每日收支趋势（自实现柱状图） -->
    <view class="bg-white rounded-[24rpx] mx-[24rpx] mt-[4rpx] p-[24rpx] border border-[#EEF1F6]">
      <view class="flex flex-row items-center justify-between mb-[20rpx]">
        <text class="text-[28rpx] font-semibold text-[#1F2329]">每日收支趋势</text>
        <view class="flex flex-row items-center">
          <view class="flex flex-row items-center mr-[16rpx]">
            <view class="w-[12rpx] h-[12rpx] rounded-[2rpx] bg-[#E5484D] mr-[6rpx]" />
            <text class="text-[22rpx] text-[#6B7280]">收入</text>
          </view>
          <view class="flex flex-row items-center">
            <view class="w-[12rpx] h-[12rpx] rounded-[2rpx] bg-[#16A34A] mr-[6rpx]" />
            <text class="text-[22rpx] text-[#6B7280]">支出</text>
          </view>
        </view>
      </view>

      <view v-if="activeTrend.length > 0" class="w-full">
        <scroll-view scroll-x class="whitespace-nowrap" :show-scrollbar="false">
          <view class="flex flex-row items-end" :style="{ height: '280rpx', minWidth: `${Math.max(activeTrend.length * 36, 320)}px` }">
            <view
              v-for="(d, i) in activeTrend"
              :key="d.date"
              class="flex flex-col items-center justify-end mr-[8rpx]"
              style="width: 28rpx;"
            >
              <!-- 红（收入）+ 绿（支出）并列柱 -->
              <view class="flex flex-row items-end" style="height: 220rpx;">
                <view
                  class="w-[12rpx] rounded-t-[2rpx] bg-[#E5484D]"
                  :style="{ height: `${(d.income / maxTrendValue) * 220}rpx` }"
                />
                <view
                  class="w-[12rpx] rounded-t-[2rpx] bg-[#16A34A] ml-[2rpx]"
                  :style="{ height: `${(d.expense / maxTrendValue) * 220}rpx` }"
                />
              </view>
              <text class="text-[18rpx] text-[#9AA1AC] mt-[6rpx]">
                {{ dayjs(d.date).date() }}日
              </text>
            </view>
          </view>
        </scroll-view>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[80rpx]">
        <text class="i-carbon-chart-column text-[64rpx] text-[#d0d5dd]" />
        <text class="text-[26rpx] text-[#9AA1AC] mt-[8rpx]">暂无收支记录</text>
      </view>
    </view>

    <!-- 利润走势（SVG 自实现） -->
    <view class="bg-white rounded-[24rpx] mx-[24rpx] mt-[20rpx] p-[24rpx] mb-[200rpx] border border-[#EEF1F6]">
      <view class="flex flex-row items-center justify-between mb-[20rpx]">
        <text class="text-[28rpx] font-semibold text-[#1F2329]">利润走势</text>
        <view class="flex flex-row items-center">
          <view class="w-[12rpx] h-[12rpx] rounded-full bg-[#E5484D] mr-[6rpx]" />
          <text class="text-[22rpx] text-[#6B7280]">净利</text>
        </view>
      </view>

      <view v-if="activeTrend.length > 0" class="w-full">
        <view style="width: 100%; height: 240rpx;">
          <svg width="100%" height="240" viewBox="0 0 320 120" preserveAspectRatio="none">
            <line x1="0" y1="100" x2="320" y2="100" stroke="#EEF1F6" stroke-width="1" />
            <path
              :d="profitPoints.path"
              fill="none"
              stroke="#E5484D"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <g fill="#E5484D">
              <circle
                v-for="(p, i) in profitPoints.dots"
                :key="i"
                :cx="p.x"
                :cy="p.y"
                r="2.5"
              />
            </g>
          </svg>
        </view>
      </view>
      <view v-else class="flex flex-col items-center justify-center py-[80rpx]">
        <text class="i-carbon-chart-line text-[64rpx] text-[#d0d5dd]" />
        <text class="text-[26rpx] text-[#9AA1AC] mt-[8rpx]">暂无利润数据</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.min-h-screen {
  min-height: 100vh;
}
.box-border {
  box-sizing: border-box;
}
</style>