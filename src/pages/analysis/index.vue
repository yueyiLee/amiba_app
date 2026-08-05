<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { getOverview, getCustomerAnalysis, getProductAnalysis, getContractAnalysis, getExpenseAnalysis, getCashAnalysis } from '@/api/analysis'
import type { AnalysisSeg, IOverviewData, ICustomerData, IProductData, IContractData, IExpenseData, ICashData } from '@/api/types/analysis'
import DateRangePicker from '@/components/DateRangePicker.vue'

definePage({
  style: {
    navigationBarTitleText: '分析',
  },
})

// ========== 当前选中的子功能面板 ==========
const activeSeg = ref<AnalysisSeg>('overview')

// ========== 共享时间范围状态（PRD v2.1 §2.2） ==========
/** 日期范围 v-model，默认本月 1 日 ~ 今天 */
const dateRange = ref<[string, string] | null>([
  dayjs().startOf('month').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD'),
])

/** 时间范围解析：从 dateRange 推导 start / end / label */
const timeRange = computed(() => {
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    const startD = dayjs(start)
    const endD = dayjs(end)
    // 如果起止跨月，展示为日期范围；同月则展示月份
    const label
      = startD.year() === endD.year() && startD.month() === endD.month()
        ? `${startD.year()}年${startD.month() + 1}月`
        : `${startD.format('YYYY/MM/DD')} ~ ${endD.format('YYYY/MM/DD')}`
    return { start, end, label, granularity: 'range' as const }
  }
  // fallback：当月
  const d = dayjs()
  return {
    start: d.startOf('month').format('YYYY-MM-DD'),
    end: d.format('YYYY-MM-DD'),
    label: `${d.year()}年${d.month() + 1}月`,
    granularity: 'range' as const,
  }
})

// ========== 各面板数据 / 加载 / 错误状态 ==========
const overview = ref<IOverviewData | null>(null)
const overviewLoading = ref(false)
const overviewError = ref<string | null>(null)

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

const cashData = ref<ICashData | null>(null)
const cashLoading = ref(false)
const cashError = ref<string | null>(null)

// ========== 面板加载配置映射（PRD v2.1：amoeba → cash） ==========
const PANEL_CONFIG: Record<AnalysisSeg, {
  loader: (startDate: string, endDate: string) => Promise<unknown>
  data: { value: unknown }
  loading: { value: boolean }
  error: { value: string | null }
}> = {
  overview: {
    loader: (start, end) => getOverview(start, end),
    data: overview, loading: overviewLoading, error: overviewError,
  },
  customer: {
    loader: (start, end) => getCustomerAnalysis(start, end),
    data: customerData, loading: customerLoading, error: customerError,
  },
  product: {
    loader: (start, end) => getProductAnalysis(start, end),
    data: productData, loading: productLoading, error: productError,
  },
  contract: {
    loader: (start, end) => getContractAnalysis(start, end),
    data: contractData, loading: contractLoading, error: contractError,
  },
  expense: {
    loader: (start, end) => getExpenseAnalysis(start, end),
    data: expenseData, loading: expenseLoading, error: expenseError,
  },
  cash: {
    loader: (start, end) => getCashAnalysis(start, end),
    data: cashData, loading: cashLoading, error: cashError,
  },
}

/** 已加载的面板集合，避免重复请求 */
const loadedSegs = new Set<AnalysisSeg>()

/** 统一加载面板数据（按需、去重、错误处理） */
async function loadPanel(seg: AnalysisSeg, force = false) {
  const panel = PANEL_CONFIG[seg]
  if (panel.loading.value) return
  if (!force && loadedSegs.has(seg)) return
  panel.loading.value = true
  panel.error.value = null
  try {
    const tr = timeRange.value
    panel.data.value = await panel.loader(tr.start, tr.end)
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

/** 当前面板的错误信息 */
const activeError = computed(() => PANEL_CONFIG[activeSeg.value].error.value)

/** 切换面板时按需加载对应数据 */
function loadForSeg(seg: AnalysisSeg) {
  loadPanel(seg)
}

// 监听宫格切换
watch(activeSeg, (seg) => {
  loadForSeg(seg)
})

// ========== 时间筛选回调（DateRangePicker confirm） ==========
function onDateConfirm({ start_date, end_date }: { start_date: string, end_date: string }) {
  dateRange.value = [start_date, end_date]
  loadedSegs.clear()
  loadForSeg(activeSeg.value)
}

// ========== 预警 / Top 榜跳转（支持 jumpKey 高亮） ==========
function onNavigate(seg?: AnalysisSeg, _jumpKey?: string) {
  if (seg) activeSeg.value = seg
  loadForSeg(activeSeg.value)
}

onShow(() => {
  loadForSeg(activeSeg.value)
})
</script>

<template>
  <view class="min-h-screen bg-[#F4F6F9]">
    <!-- 状态栏占位 -->
    <view class="pt-safe" />

    <!-- 顶部标题区（PRD v2.1 §1 模块 0-A） -->
    <view class="px-[32rpx] pb-[20rpx] pt-[12rpx]">
      <view class="text-[42rpx] text-[#1F2329] font-bold leading-[52rpx]">
        分析
      </view>
      <view class="mt-[4rpx] text-[24rpx] text-[#6B7280]">
        指定时间范围的经营分析
      </view>
    </view>

    <!-- 6 宫格子功能入口（PRD v2.1 §1.1） -->
    <view class="mx-[24rpx]">
      <AnalysisSegGrid v-model="activeSeg" />
    </view>

    <!-- 共享时间筛选：使用 DateRangePicker 组件（PRD v2.1 §2.2） -->
    <view class="mx-[24rpx] mt-[20rpx]">
      <DateRangePicker
        v-model="dateRange"
        @confirm="onDateConfirm"
      />
    </view>

    <!-- 面板区：v-if 即时切换（PRD v2.1 §2.1） -->
    <view class="mx-[24rpx] mb-[200rpx] mt-[20rpx]">
      <!-- 加载失败时的错误提示 -->
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

      <!-- 6 个子功能面板（v-if） -->
      <CockpitPanel
        v-if="activeSeg === 'overview'"
        :data="overview"
        :loading="overviewLoading"
        @navigate="onNavigate"
      />
      <CustomerPanel
        v-if="activeSeg === 'customer'"
        :data="customerData"
        :loading="customerLoading"
      />
      <ProductPanel
        v-if="activeSeg === 'product'"
        :data="productData"
        :loading="productLoading"
      />
      <ContractPanel
        v-if="activeSeg === 'contract'"
        :data="contractData"
        :loading="contractLoading"
        :error="contractError"
        @retry="loadPanel('contract', true)"
      />
      <ExpensePanel
        v-if="activeSeg === 'expense'"
        :data="expenseData"
        :loading="expenseLoading"
        :error="expenseError"
        @retry="loadPanel('expense', true)"
      />
      <CashPanel
        v-if="activeSeg === 'cash'"
        :data="cashData"
        :loading="cashLoading"
      />
    </view>
  </view>
</template>
