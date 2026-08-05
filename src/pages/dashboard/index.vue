<script lang="ts" setup>
import { ref } from 'vue'
import dayjs from 'dayjs'
import { getDashboardV2 } from '@/api/analysis'
import type { IDashboardV2Data } from '@/api/types/analysis'
import DateRangePicker from '@/components/DateRangePicker.vue'
import AmoebaCoreKpi from './components/AmoebaCoreKpi.vue'
import DailyOperationKpi from './components/DailyOperationKpi.vue'
import EmployeeSalary from './components/EmployeeSalary.vue'
import BusinessCharts from './components/BusinessCharts.vue'
import InventoryOverview from './components/InventoryOverview.vue'
import { useShare } from '@/utils/share/useShare'
import { SHARE_CONFIGS } from '@/utils/share/config'

defineOptions({
  // 小程序端：显式声明分享钩子，微信才会识别页面已设置分享
  ...useShare(SHARE_CONFIGS.dashboard),
})

definePage({
  style: {
    navigationBarTitleText: '看板',
  },
})

// ========== 时间范围 ==========
/** 初始默认本月 */
const defaultStart = dayjs().startOf('month').format('YYYY-MM-DD')
const defaultEnd = dayjs().format('YYYY-MM-DD')

const dateRange = ref<[string, string]>([defaultStart, defaultEnd])
const loading = ref(false)
const dashboard = ref<IDashboardV2Data | null>(null)

/** DateRangePicker confirm 事件 */
function onDateConfirm(val: { start_date: string; end_date: string }) {
  dateRange.value = [val.start_date, val.end_date]
  loadData()
}

/** 加载看板数据 */
async function loadData() {
  loading.value = true
  try {
    const [startDate, endDate] = dateRange.value
    dashboard.value = await getDashboardV2(startDate, endDate)
  } catch {
    dashboard.value = null
  } finally {
    loading.value = false
  }
}

/** 手动刷新 */
function onRefresh() {
  loadData()
}

// 初始加载
loadData()
</script>

<template>
  <view class="min-h-screen bg-[#EEF1F6]">
    <!-- 状态栏占位 -->
    <view class="pt-safe" />

    <!-- 顶部标题栏 -->
    <view class="flex flex-row items-center justify-between px-[32rpx] pt-[12rpx] pb-[20rpx]">
      <view>
        <view class="text-[42rpx] font-bold text-[#1F2329] leading-[52rpx]">
          看板
        </view>
        <view class="text-[24rpx] text-[#6B7280] mt-[4rpx]">
          经营全景
        </view>
      </view>
      <view
        class="w-[76rpx] h-[76rpx] rounded-[24rpx] bg-white border border-[#E5E7EB] flex items-center justify-center"
        hover-class="opacity-60"
        @click="onRefresh"
      >
        <text class="i-carbon-renew text-[40rpx] text-[#1F2329]" />
      </view>
    </view>

    <!-- 时间筛选（复用 DateRangePicker） -->
    <view class="mx-[24rpx] mb-[20rpx]">
      <DateRangePicker
        :model-value="dateRange"
        @confirm="onDateConfirm"
      />
    </view>

    <!-- 加载中 -->
    <view v-if="loading && !dashboard" class="flex flex-col items-center justify-center py-[200rpx]">
      <wd-loading />
      <text class="text-[26rpx] text-[#9AA1AC] mt-[16rpx]">加载经营数据中...</text>
    </view>

    <!-- 看板内容 -->
    <template v-if="dashboard">
      <!-- 模块一：阿米巴核心指标 -->
      <AmoebaCoreKpi :cockpit="dashboard.cockpit" :amoeba="dashboard.amoeba" />

      <!-- 模块二：日常经营指标 -->
      <DailyOperationKpi :cockpit="dashboard.cockpit" :daily-trend="dashboard.dailyTrend" />

      <!-- 模块三：员工工资 -->
      <EmployeeSalary :cockpit="dashboard.cockpit" />

      <!-- 模块四：经营图表 -->
      <BusinessCharts
        :daily-trend="dashboard.dailyTrend"
        :start-date="dateRange[0]"
        :end-date="dateRange[1]"
      />

      <!-- 模块五：库存总览 -->
      <InventoryOverview :inventory="dashboard.inventory" />
    </template>

    <!-- 空数据 -->
    <view v-if="!loading && !dashboard" class="flex flex-col items-center justify-center py-[200rpx]">
      <text class="i-carbon-chart-line text-[64rpx] text-[#d0d5dd]" />
      <text class="text-[26rpx] text-[#9AA1AC] mt-[8rpx]">暂无经营数据</text>
      <view
        class="mt-[24rpx] px-[32rpx] py-[12rpx] bg-[#165DFF] text-white rounded-[20rpx] text-[28rpx]"
        hover-class="opacity-80"
        @click="onRefresh"
      >
        重新加载
      </view>
    </view>

    <!-- 底部安全距离 -->
    <view class="pb-[80rpx]" />
  </view>
</template>

<style lang="scss" scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>
