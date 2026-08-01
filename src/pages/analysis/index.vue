<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { ALL_UNITS, getCockpit, getCustomerAnalysis, getProductAnalysis, getContractAnalysis, getExpenseAnalysis, getAmoebaAnalysis } from '@/api/analysis'
import type { AnalysisSeg, ICockpitData, ICustomerData, IProductData, IContractData, IExpenseData, IAmoebaData } from '@/api/types/analysis'

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

// 各面板数据 / 加载 / 错误状态
const cockpit = ref<ICockpitData | null>(null)
const cockpitLoading = ref(false)
const cockpitError = ref<string | null>(null)

const customerData = ref<ICustomerData | null>(null)
const customerLoading = ref(false)
const customerError = ref<string | null>(null)

const productData = ref<IProductData | null>(null)
const productLoading = ref(false)
const productError = ref<string | null>(null)

const contractData = ref<IContractData | null>(null)
const contractLoading = ref(false)
const contractError = ref<string | null>(null)

const expenseData = ref<IExpenseData | null>(null)
const expenseLoading = ref(false)
const expenseError = ref<string | null>(null)

const amoebaData = ref<IAmoebaData | null>(null)
const amoebaLoading = ref(false)
const amoebaError = ref<string | null>(null)

/** 各面板 API 加载函数映射（返回 [data, loading, error] 对应 ref） */
const PANEL_CONFIG: Record<AnalysisSeg, {
  loader: (month: string) => Promise<unknown>
  data: { value: unknown }
  loading: { value: boolean }
  error: { value: string | null }
}> = {
  overview: {
    loader: (m) => getCockpit(m, currentUnit.value),
    data: cockpit, loading: cockpitLoading, error: cockpitError,
  },
  customer: { loader: getCustomerAnalysis, data: customerData, loading: customerLoading, error: customerError },
  product: { loader: getProductAnalysis, data: productData, loading: productLoading, error: productError },
  contract: { loader: getContractAnalysis, data: contractData, loading: contractLoading, error: contractError },
  expense: { loader: getExpenseAnalysis, data: expenseData, loading: expenseLoading, error: expenseError },
  amoeba: { loader: getAmoebaAnalysis, data: amoebaData, loading: amoebaLoading, error: amoebaError },
}

/** 已加载的面板集合，避免重复请求 */
const loadedSegs = new Set<AnalysisSeg>()

/** 统一加载面板数据（按需、去重、错误处理） */
async function loadPanel(seg: AnalysisSeg, force = false) {
  const panel = PANEL_CONFIG[seg]
  if (panel.loading.value) return // 已有在途请求
  if (!force && loadedSegs.has(seg)) return // 已加载过，避免重复请求
  panel.loading.value = true
  panel.error.value = null
  try {
    panel.data.value = await panel.loader(currentMonth.value)
    loadedSegs.add(seg)
  }
  catch (e) {
    console.error(`[analysis] loadPanel(${seg}) failed:`, e)
    panel.data.value = null
    panel.error.value = '数据加载失败，请重试'
  }
  finally {
    panel.loading.value = false
  }
}

/** 当前面板的错误信息（供模板提示用） */
const activeError = computed(() => PANEL_CONFIG[activeSeg.value].error.value)

/** 切换面板时按需加载对应数据 */
function loadForSeg(seg: AnalysisSeg) {
  loadPanel(seg)
}

// 监听宫格切换，按需加载当前面板数据
watch(activeSeg, (seg) => {
  loadForSeg(seg)
})

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
  // 月份变化后清空缓存，强制刷新所有已加载面板
  loadedSegs.clear()
  loadForSeg(activeSeg.value)
}

function openUnitPicker() {
  uni.showToast({ title: '暂仅支持全部单元', icon: 'none' })
}

/** 预警 / Top 榜点击后切换到对应分析面板，并按需加载数据 */
function onNavigate(seg: AnalysisSeg) {
  activeSeg.value = seg
  loadForSeg(seg)
}

onShow(() => {
  loadForSeg(activeSeg.value)
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
      <!-- 当前面板加载失败时的错误提示 -->
      <view
        v-if="activeError"
        class="mb-[20rpx] rounded-[20rpx] bg-[#FFF3F0] px-[28rpx] py-[24rpx]"
      >
        <view class="flex items-center gap-[12rpx]">
          <text class="i-carbon-warning-alt-filled text-[32rpx] text-[#E5484D]" />
          <text class="flex-1 text-[26rpx] text-[#E5484D]">{{ activeError }}</text>
          <text
            class="shrink-0 text-[26rpx] text-[#E5484D] font-medium"
            hover-class="opacity-60"
            @click="loadPanel(activeSeg, true)"
          >
            重试
          </text>
        </view>
      </view>
      <CockpitPanel
        v-show="activeSeg === 'overview'"
        :data="cockpit"
        :loading="cockpitLoading"
        @navigate="onNavigate"
      />
      <CustomerPanel
        v-show="activeSeg === 'customer'"
        :data="customerData"
        :loading="customerLoading"
      />
      <ProductPanel
        v-show="activeSeg === 'product'"
        :data="productData"
        :loading="productLoading"
      />
      <ContractPanel
        v-show="activeSeg === 'contract'"
        :data="contractData"
        :loading="contractLoading"
      />
      <ExpensePanel
        v-show="activeSeg === 'expense'"
        :data="expenseData"
        :loading="expenseLoading"
      />
      <AmoebaPanel
        v-show="activeSeg === 'amoeba'"
        :data="amoebaData"
        :loading="amoebaLoading"
      />
    </view>
  </view>
</template>
