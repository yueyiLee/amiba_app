<script lang="ts" setup>
import { computed, ref } from 'vue'
import type { IContractData, IContractRow } from '@/api/types/analysis'
import { formatAmount } from '@/utils/format'

/**
 * 合同分析面板（PRD v2.1 §6）
 * 结构：3 张 KPI → 状态筛选胶囊 → 合同明细卡片列表（执行率进度条 + 状态徽章）
 */
const props = defineProps<{
  data: IContractData | null
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()

// ========== 状态筛选（PRD §6.2） ==========
type ContractFilter = 'all' | 'lag' | 'progress' | 'healthy'
const activeFilter = ref<ContractFilter>('all')

const filterTabs: { key: ContractFilter; label: string; bgClass: string; textClass: string }[] = [
  { key: 'all', label: '全部', bgClass: 'bg-[#F1F3F7]', textClass: 'text-[#1F2329]' },
  { key: 'lag', label: '回款滞后', bgClass: 'bg-[#FEF2F2]', textClass: 'text-[#E5484D]' },
  { key: 'progress', label: '执行中', bgClass: 'bg-[#FFFBEB]', textClass: 'text-[#B45309]' },
  { key: 'healthy', label: '健康', bgClass: 'bg-[#ECFDF5]', textClass: 'text-[#16A34A]' },
]

const filterMap: Record<ContractFilter, string | null> = {
  all: null,
  lag: '回款滞后',
  progress: '执行中',
  healthy: '健康',
}

// ========== Computed：安全访问数据 ==========
const kpi = computed(() => props.data?.kpi)
const rows = computed<IContractRow[]>(() => props.data?.rows ?? [])

const filteredRows = computed<IContractRow[]>(() => {
  const target = filterMap[activeFilter.value]
  if (target === null) return rows.value
  return rows.value.filter(r => r.status === target)
})

// ========== 格式化函数 ==========
/** KPI 金额格式化（带 ¥ 前缀，千分位） */
function fmtKpi(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  return `¥ ${formatAmount(val)}`
}

/** 行金额格式化 */
function fmtRow(val: number | undefined | null): string {
  if (val == null || !Number.isFinite(val)) return '--'
  return `¥${formatAmount(val)}`
}

/** 执行率百分比 */
function fmtRatio(ratio: number | undefined | null): string {
  if (ratio == null || !Number.isFinite(ratio)) return '--%'
  return `${Math.round(ratio * 100)}%`
}

/** 进度条宽度百分比 */
function barPct(ratio: number | undefined | null): string {
  if (ratio == null || !Number.isFinite(ratio)) return '0%'
  return `${Math.min(ratio * 100, 100).toFixed(0)}%`
}

// ========== 徽章样式（PRD §6.1） ==========
function getStatusBadge(status: string): { label: string; bgClass: string; textClass: string } {
  switch (status) {
    case '回款滞后': return { label: '回款滞后', bgClass: 'bg-[#FEF2F2]', textClass: 'text-[#E5484D]' }
    case '执行中': return { label: '执行中', bgClass: 'bg-[#FFFBEB]', textClass: 'text-[#B45309]' }
    case '健康': return { label: '健康', bgClass: 'bg-[#ECFDF5]', textClass: 'text-[#16A34A]' }
    default: return { label: status, bgClass: 'bg-[#F1F3F7]', textClass: 'text-[#6B7280]' }
  }
}

/** 格式化日期范围 */
function fmtDateRange(start: string, end: string): string {
  if (!start && !end) return '—'
  if (start && end) return `${start} ~ ${end}`
  return start || end
}
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <!-- ====== 3 张 KPI：一行三列（PRD §6.2 标注 1） ====== -->
    <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
      <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
        <text class="text-[29rpx] font-bold text-[#1F2329]">📄 合同分析</text>
        <text class="text-[22rpx] text-[#9AA1AC]">本期</text>
      </view>

      <view class="mt-[16rpx] flex gap-[12rpx] px-[8rpx]">
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">合同总金额</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#E5484D] tabular-nums">{{ fmtKpi(kpi?.total_amount) }}</text>
        </view>
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center">
          <text class="text-[21rpx] text-[#6B7280]">已回款</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#E5484D] tabular-nums">{{ fmtKpi(kpi?.total_paid) }}</text>
        </view>
        <view class="flex-1 rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[16rpx] py-[18rpx] text-center" style="box-shadow: inset -6rpx 0 0 0 #F59E0B">
          <text class="text-[21rpx] text-[#6B7280]">未回款</text>
          <text class="mt-[8rpx] block text-[32rpx] font-bold text-[#F59E0B] tabular-nums">{{ fmtKpi(kpi?.total_unpaid) }}</text>
        </view>
      </view>
    </view>

    <!-- ====== 加载骨架屏 ====== -->
    <template v-if="loading">
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex gap-[8rpx] px-[8rpx] pb-[16rpx]">
          <view class="h-[40rpx] w-[160rpx] rounded-[8rpx] bg-[#F1F3F7]" />
        </view>
        <view class="flex gap-[12rpx] px-[8rpx]">
          <view class="h-[64rpx] flex-1 rounded-[12rpx] bg-[#F1F3F7]" />
          <view class="h-[64rpx] flex-1 rounded-[12rpx] bg-[#F1F3F7]" />
          <view class="h-[64rpx] flex-1 rounded-[12rpx] bg-[#F1F3F7]" />
        </view>
      </view>
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="space-y-[16rpx] px-[8rpx]">
          <view class="h-[120rpx] rounded-[16rpx] bg-[#F1F3F7]" v-for="i in 3" :key="i" />
        </view>
      </view>
    </template>

    <!-- ====== 错误态 ====== -->
    <template v-else-if="error">
      <view class="rounded-[18rpx] bg-[#FEF2F2] border border-[#FCA5A5] px-[20rpx] py-[16rpx] flex items-center justify-between">
        <text class="text-[25rpx] text-[#E5484D] flex-1 mr-[16rpx]">{{ error }}</text>
        <text class="text-[25rpx] font-semibold text-[#E5484D] bg-[#FFF5F5] rounded-[12rpx] px-[20rpx] py-[8rpx]" @click="emit('retry')">重试</text>
      </view>
    </template>

    <!-- ====== 正常内容 ====== -->
    <template v-else>
      <!-- 合同明细卡片列表（PRD §6.2 标注 2） -->
      <view class="rounded-[24rpx] bg-white border border-[#EEF1F6] px-[20rpx] py-[20rpx]">
        <view class="flex items-baseline gap-[8rpx] px-[8rpx] pb-[16rpx] border-b border-[#F0F2F5]">
          <text class="text-[29rpx] font-bold text-[#1F2329]">📋 合同明细</text>
          <text class="text-[22rpx] text-[#9AA1AC]">按金额倒序</text>
        </view>

        <!-- 状态筛选胶囊（PRD §6.2 交互） -->
        <scroll-view scroll-x class="mt-[16rpx]" :show-scrollbar="false">
          <view class="flex gap-[8rpx] px-[8rpx] whitespace-nowrap">
            <text
              v-for="tab in filterTabs"
              :key="tab.key"
              :class="[
                activeFilter === tab.key ? `${tab.bgClass} ${tab.textClass} font-semibold` : 'bg-[#F8FAFC] text-[#9AA1AC]',
              ]"
              class="rounded-[16rpx] px-[16rpx] py-[8rpx] text-[21rpx] transition-colors"
              @click="activeFilter = tab.key"
            >{{ tab.label }}</text>
          </view>
        </scroll-view>

        <!-- ====== 空态 ====== -->
        <view v-if="filteredRows.length === 0" class="mt-[32rpx] mb-[24rpx] flex flex-col items-center gap-[12rpx]">
          <text class="text-[80rpx]">📄</text>
          <text class="text-[25rpx] text-[#9AA1AC]">{{ rows.length === 0 ? '暂无合同数据' : '当前筛选无匹配合同' }}</text>
        </view>

        <!-- 合同卡片列表 -->
        <view v-else class="mt-[16rpx] flex flex-col gap-[12rpx] px-[8rpx]">
          <view
            v-for="row in filteredRows"
            :key="row.id"
            class="rounded-[18rpx] bg-[#FBFCFE] border border-[#EEF1F6] px-[20rpx] py-[18rpx]"
          >
            <!-- 第一行：合同名 + 状态徽章 -->
            <view class="flex items-center justify-between">
              <view class="flex-1 min-w-0">
                <text class="text-[25rpx] font-bold text-[#1F2329] truncate">{{ row.name }}</text>
              </view>
              <view
                :class="getStatusBadge(row.status).bgClass"
                class="rounded-[12rpx] px-[12rpx] py-[2rpx] shrink-0 ml-[12rpx]"
              >
                <text
                  :class="getStatusBadge(row.status).textClass"
                  class="text-[20rpx] font-semibold"
                >{{ getStatusBadge(row.status).label }}</text>
              </view>
            </view>

            <!-- 第二行：客户 · 起止日期 -->
            <text class="block mt-[6rpx] text-[21rpx] text-[#9AA1AC] truncate">
              {{ row.customer }}<template v-if="row.start_date || row.end_date">　·　{{ fmtDateRange(row.start_date, row.end_date) }}</template>
            </text>

            <!-- 第三行：金额三栏 -->
            <view class="mt-[12rpx] flex gap-[12rpx]">
              <view class="flex-1 rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[12rpx]">
                <text class="text-[20rpx] text-[#9AA1AC]">合同金额</text>
                <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#E5484D] tabular-nums">{{ fmtRow(row.amount) }}</text>
              </view>
              <view class="flex-1 rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[12rpx]">
                <text class="text-[20rpx] text-[#9AA1AC]">已回款</text>
                <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#E5484D] tabular-nums">{{ fmtRow(row.paid) }}</text>
              </view>
              <view class="flex-1 rounded-[12rpx] bg-[#F8FAFC] px-[14rpx] py-[12rpx]">
                <text class="text-[20rpx] text-[#9AA1AC]">未回款</text>
                <text class="mt-[4rpx] block text-[26rpx] font-bold text-[#F59E0B] tabular-nums">{{ fmtRow(row.unpaid) }}</text>
              </view>
            </view>

            <!-- 第四行：执行率进度条（PRD §6.2 标注 3） -->
            <view class="mt-[12rpx]">
              <view class="h-[16rpx] rounded-[8rpx] bg-[#F1F3F7] overflow-hidden">
                <view
                  class="h-full rounded-[8rpx] transition-all duration-500"
                  :style="{ width: barPct(row.ratio), background: 'linear-gradient(90deg, #F59E0B, #E5484D)' }"
                />
              </view>
              <view class="mt-[4rpx] flex justify-between text-[20rpx]">
                <text class="text-[#9AA1AC]">执行率</text>
                <text class="text-[#6B7280] font-semibold tabular-nums">{{ fmtRatio(row.ratio) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>
