<script lang="ts" setup>
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { ALL_UNITS, getCockpit } from '@/api/analysis'
import type { AnalysisSeg, ICockpitData } from '@/api/types/analysis'

definePage({
  style: {
    navigationBarTitleText: '分析',
  },
})

// 当前选中的子功能面板
const activeSeg = ref<AnalysisSeg>('overview')

// 6 个分析子页共享的筛选状态
const currentDate = ref(dayjs())
const currentMonth = computed(() => currentDate.value.format('YYYY-MM'))
const monthText = computed(() => `${currentDate.value.year()}年${currentDate.value.month() + 1}月`)
// 本期仅支持「全部单元」，待单元数据模型明确后再接入具体单元
const currentUnit = ref(ALL_UNITS)

// 驾驶舱数据
const cockpit = ref<ICockpitData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

/** 请求去重：记录最后一次请求的月份，避免重复请求 */
let lastRequestedMonth = ''

/** 加载驾驶舱聚合数据 */
async function loadCockpit() {
  const month = currentMonth.value
  if (loading.value && lastRequestedMonth === month) {
    return // 已有相同月份的在途请求，跳过
  }
  lastRequestedMonth = month
  loading.value = true
  error.value = null
  try {
    cockpit.value = await getCockpit(month, currentUnit.value)
  }
  catch (e) {
    console.error('[analysis] loadCockpit failed:', e)
    cockpit.value = null
    error.value = '数据加载失败，请下拉刷新或切换月份重试'
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
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    console.warn('[analysis] onMonthConfirm received invalid value:', value)
    return
  }
  currentDate.value = dayjs(value)
  loadCockpit()
}

function openUnitPicker() {
  uni.showToast({ title: '暂仅支持全部单元', icon: 'none' })
}

/** 预警 / Top 榜点击后切换到对应分析面板 */
function onNavigate(seg: AnalysisSeg) {
  activeSeg.value = seg
}

onShow(() => {
  loadCockpit()
})
</script>

<template>
  <view class="min-h-screen bg-[#F4F6F9]">
    <!-- 状态栏占位 -->
    <view class="pt-safe" />

    <!-- 顶部标题区 -->
    <view class="px-[32rpx] pb-[20rpx] pt-[12rpx]">
      <view class="text-[42rpx] text-[#1F2329] font-bold leading-[52rpx]">
        分析
      </view>
      <view class="mt-[4rpx] text-[24rpx] text-[#6B7280]">
        与 PC 端一致的 6 大经营分析
      </view>
    </view>

    <!-- 6 宫格子功能入口（两行三列） -->
    <view class="mx-[24rpx]">
      <AnalysisSegGrid v-model="activeSeg" />
    </view>

    <!-- 共享筛选条：时间范围（月） + 单元筛选 -->
    <view class="mx-[24rpx] mt-[20rpx]">
      <AnalysisFilterBar
        :month-text="monthText"
        :unit-text="currentUnit"
        @open-month="openMonthPicker"
        @open-unit="openUnitPicker"
      />
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

    <!-- 面板区：v-show 即时切换，共享筛选状态，切换不触发请求 -->
    <view class="mx-[24rpx] mb-[200rpx] mt-[20rpx]">
      <!-- 加载失败时的错误提示 -->
      <view v-if="error && activeSeg === 'overview'" class="mb-[20rpx] rounded-[20rpx] bg-[#FFF3F0] px-[28rpx] py-[24rpx]">
        <view class="flex items-center gap-[12rpx]">
          <text class="i-carbon-warning-alt-filled text-[32rpx] text-[#E5484D]" />
          <text class="flex-1 text-[26rpx] text-[#E5484D]">{{ error }}</text>
          <text
            class="shrink-0 text-[26rpx] text-[#E5484D] font-medium"
            hover-class="opacity-60"
            @click="loadCockpit"
          >
            重试
          </text>
        </view>
      </view>
      <CockpitPanel
        v-show="activeSeg === 'overview'"
        :data="cockpit"
        :loading="loading"
        @navigate="onNavigate"
      />
      <CustomerPanel v-show="activeSeg === 'customer'" />
      <ProductPanel v-show="activeSeg === 'product'" />
      <ContractPanel v-show="activeSeg === 'contract'" />
      <ExpensePanel v-show="activeSeg === 'expense'" />
      <AmoebaPanel v-show="activeSeg === 'amoeba'" />
    </view>
  </view>
</template>
