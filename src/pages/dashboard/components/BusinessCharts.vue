<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { IDailyTrendData } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'
import qiunDataCharts from '@/components/qiun-data-charts/qiun-data-charts.vue'

const props = defineProps<{
  dailyTrend: IDailyTrendData
  startDate: string
  endDate: string
}>()

// ========== 颜色常量 ==========
const COLORS = {
  red: '#E5484D',
  green: '#16A34A',
  incomeRing: ['#E5484D', '#f87171', '#fca5a5'],
  expenseRing: ['#3b82f6', '#F59E0B', '#8b5cf6', '#ef4444'],
}

// ========== 收支趋势折线图 ==========
const trendChartData = computed(() => {
  const trend = props.dailyTrend.trend ?? []
  const categories: string[] = []
  const incomeSeries: number[] = []
  const expenseSeries: number[] = []

  trend.forEach((d, i) => {
    // 按日期抽稀标签：仅显示 1/5/10/15/20/25/月末
    const day = parseInt(d.date.split('-')[2] ?? '0', 10)
    const isKey = [1, 5, 10, 15, 20, 25].includes(day) || i === trend.length - 1
    categories.push(isKey ? `${day}日` : '')
    incomeSeries.push(d.income)
    expenseSeries.push(d.expense)
  })

  return {
    categories,
    series: [
      { name: '收入', data: incomeSeries, color: COLORS.red },
      { name: '支出', data: expenseSeries, color: COLORS.green },
    ],
  }
})

const trendOpts = computed(() => ({
  type: 'line',
  canvas2d: false,
  animation: true,
  legend: { show: false },
  xAxis: {
    disableGrid: true,
    axisLine: true,
    axisLineColor: '#EEF1F6',
    fontColor: '#9AA1AC',
    fontSize: 9,
    labelCount: 6,
  },
  yAxis: {
    gridType: 'dash',
    dashLength: 4,
    disabled: false,
    axisLine: false,
    fontColor: '#9AA1AC',
    fontSize: 9,
    splitNumber: 4,
    data: [{ title: '金额', min: 0 }],
  },
  extra: {
    line: {
      type: 'straight',
      width: 2,
      activeType: 'none',
    },
  },
  color: [COLORS.red, COLORS.green],
  dataLabel: false,
  dataPointShape: false,
}))

// ========== 支出构成环形图 ==========
const expenseRingChartData = computed(() => {
  const compose = props.dailyTrend.expenseCompose ?? []
  const total = compose.reduce((s, i) => s + i.amount, 0)
  return {
    series: [{
      data: compose.map((i, idx) => ({
        name: i.name,
        value: i.amount,
        color: COLORS.expenseRing[idx % 4],
      })),
    }],
    total,
  }
})

const expenseRingOpts = computed(() => ({
  type: 'ring',
  canvas2d: false,
  animation: true,
  title: {
    name: `¥${formatAmount(expenseRingChartData.value.total)}`,
    fontSize: 13,
    color: '#374151',
    fontWeight: 'bold',
    offsetY: -2,
  },
  subtitle: {
    name: '总支出',
    fontSize: 10,
    color: '#9AA1AC',
    offsetY: 14,
  },
  extra: {
    ring: {
      ringWidth: 20,
      activeOpacity: 0.5,
      activeRadius: 5,
      offsetAngle: 0,
      labelWidth: 15,
      border: true,
      borderWidth: 3,
      borderColor: '#FFFFFF',
    },
  },
  legend: {
    show: false,
  },
  color: COLORS.expenseRing,
  dataLabel: false,
}))

// ========== 收入构成环形图 ==========
const incomeRingChartData = computed(() => {
  const compose = props.dailyTrend.incomeCompose ?? []
  const total = compose.reduce((s, i) => s + i.amount, 0)
  return {
    series: [{
      data: compose.map((i, idx) => ({
        name: i.name,
        value: i.amount,
        color: COLORS.incomeRing[idx % 3],
      })),
    }],
    total,
  }
})

const incomeRingOpts = computed(() => ({
  type: 'ring',
  canvas2d: false,
  animation: true,
  title: {
    name: `¥${formatAmount(incomeRingChartData.value.total)}`,
    fontSize: 13,
    color: '#374151',
    fontWeight: 'bold',
    offsetY: -2,
  },
  subtitle: {
    name: '总收入',
    fontSize: 10,
    color: '#9AA1AC',
    offsetY: 14,
  },
  extra: {
    ring: {
      ringWidth: 20,
      activeOpacity: 0.5,
      activeRadius: 5,
      offsetAngle: 0,
      labelWidth: 15,
      border: true,
      borderWidth: 3,
      borderColor: '#FFFFFF',
    },
  },
  legend: {
    show: false,
  },
  color: COLORS.incomeRing,
  dataLabel: false,
}))

// 图表重绘 key（切换数据时强制重绘）
const chartKey = ref(0)

// 监听数据变化重新绘制
import { watch } from 'vue'
watch(() => props.dailyTrend, () => {
  chartKey.value++
}, { deep: true })
</script>

<template>
  <view class="mx-[24rpx] mb-[20rpx] bg-white rounded-[16rpx] border border-[#EEF1F6] overflow-hidden">
    <!-- 模块头部 -->
    <view class="flex flex-row items-baseline gap-[8rpx] px-[28rpx] pt-[24rpx] pb-[16rpx] border-b border-[#F0F2F5]">
      <text class="text-[30rpx] font-bold text-[#1F2329]">📈 经营图表</text>
      <text class="text-[22rpx] text-[#9AA1AC]">收支趋势与构成</text>
    </view>

    <view class="p-[20rpx]">
      <!-- 收支趋势折线图 -->
      <view class="bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[20rpx] mb-[20rpx]">
        <view class="flex justify-between items-center mb-[12rpx]">
          <text class="text-[26rpx] font-semibold text-[#1F2329]">收支趋势</text>
          <text class="text-[20rpx] text-[#9AA1AC]">纵轴：金额</text>
        </view>
        <view style="width: 100%; height: 260rpx;">
          <qiunDataCharts
            :key="'trend-' + chartKey"
            type="line"
            :chart-data="trendChartData"
            :opts="trendOpts"
            :canvas2d="false"
            :ontap="false"
            :ontouch="false"
            :reshow="true"
          />
        </view>
        <!-- 图例 -->
        <view class="flex justify-center gap-[24rpx] mt-[12rpx]">
          <view class="flex items-center gap-[10rpx]">
            <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #E5484D;" />
            <text class="text-[22rpx] text-[#6B7280]">收入</text>
          </view>
          <view class="flex items-center gap-[10rpx]">
            <view class="w-[16rpx] h-[16rpx] rounded-full" style="background: #16A34A;" />
            <text class="text-[22rpx] text-[#6B7280]">支出</text>
          </view>
        </view>
      </view>

      <!-- 双环形图 -->
      <view class="flex gap-[16rpx] flex-col">
        <!-- 支出构成 -->
        <view class="flex-1 bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[20rpx]">
          <text class="text-[26rpx] font-semibold text-[#1F2329] mb-[12rpx] block">支出构成</text>
          <view class="flex flex-row items-center justify-center gap-[16rpx]">
            <view v-if="(dailyTrend.expenseCompose ?? []).length" style="width: 260rpx; height: 260rpx; flex-shrink: 0;">
              <qiunDataCharts
                :key="'exp-ring-' + chartKey"
                type="ring"
                canvas-id="expenseRing"
                :chart-data="expenseRingChartData"
                :opts="expenseRingOpts"
                :canvas2d="false"
                :ontap="false"
                :ontouch="false"
                :reshow="true"
              />
            </view>
            <view v-else class="flex items-center justify-center" style="width: 260rpx; height: 260rpx; flex-shrink: 0;">
              <text class="text-[22rpx] text-[#9AA1AC]">本期暂无支出数据</text>
            </view>
            <!-- 图例 -->
            <view v-if="(dailyTrend.expenseCompose ?? []).length" class="flex flex-col gap-[14rpx]">
              <view
                v-for="(item, idx) in (dailyTrend.expenseCompose ?? [])"
                :key="item.name"
                class="flex items-center gap-[8rpx]"
              >
                <view
                  class="w-[14rpx] h-[14rpx] rounded-full flex-shrink-0"
                  :style="{ background: ['#3b82f6', '#F59E0B', '#8b5cf6', '#ef4444'][idx % 4] }"
                />
                <text class="text-[20rpx] text-[#6B7280]">{{ item.name }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 收入构成 -->
        <view class="flex-1 bg-[#FBFCFE] rounded-[12rpx] border border-[#EEF1F6] p-[20rpx]">
          <text class="text-[26rpx] font-semibold text-[#1F2329] mb-[12rpx] block">收入构成</text>
          <view class="flex flex-row items-center justify-center gap-[16rpx]">
            <view v-if="(dailyTrend.incomeCompose ?? []).length" style="width: 260rpx; height: 260rpx; flex-shrink: 0;">
              <qiunDataCharts
                :key="'inc-ring-' + chartKey"
                type="ring"
                canvas-id="incomeRing"
                :chart-data="incomeRingChartData"
                :opts="incomeRingOpts"
                :canvas2d="false"
                :ontap="false"
                :ontouch="false"
                :reshow="true"
              />
            </view>
            <view v-else class="flex items-center justify-center" style="width: 260rpx; height: 260rpx; flex-shrink: 0;">
              <text class="text-[22rpx] text-[#9AA1AC]">本期暂无收入数据</text>
            </view>
            <!-- 图例 -->
            <view v-if="(dailyTrend.incomeCompose ?? []).length" class="flex flex-col gap-[14rpx]">
              <view
                v-for="(item, idx) in (dailyTrend.incomeCompose ?? [])"
                :key="item.name"
                class="flex items-center gap-[8rpx]"
              >
                <view
                  class="w-[14rpx] h-[14rpx] rounded-full flex-shrink-0"
                  :style="{ background: ['#E5484D', '#f87171', '#fca5a5'][idx % 3] }"
                />
                <text class="text-[20rpx] text-[#6B7280]">{{ item.name === '销售收入' ? '销售' : item.name === '现金收入' ? '现金' : '其他' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
